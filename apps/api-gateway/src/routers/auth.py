"""
Authentication Router

Handles all authentication-related endpoints:
- Sign up (registration with Supabase)
- Sign in (session-based login)
- Sign out (session cleanup)
- OTP verification for registration
- Forgot password flow (request, verify OTP, reset)
- User profile retrieval

Security features:
- Session-based authentication with secure cookies
- Password hashing with bcrypt
- OTP verification with time-based expiry
- Supabase integration for user management
- Comprehensive audit logging

All endpoints return consistent JSON responses with proper HTTP status codes.
"""

from datetime import datetime, timedelta
import hashlib
import re
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from gotrue.errors import AuthApiError
from pydantic import BaseModel, EmailStr, Field, validator
import httpx
import structlog

from ..dependencies import (
    get_settings,
    get_supabase_client,
    get_current_user,
    set_session_data,
    clear_session,
)

# Initialize router
router = APIRouter()

# Initialize logger
logger = structlog.get_logger()

# Track pending OTP requests to route resend logic and avoid duplicate submissions
otp_request_state: dict[str, dict] = {}

# Track verified OTP tokens for password reset to allow subsequent password update
verified_reset_tokens: dict[str, dict] = {}


# ============================================================================
# Request/Response Models (Pydantic schemas)
# ============================================================================

class SignUpRequest(BaseModel):
    """Request model for user registration"""
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str = Field(..., min_length=2, max_length=100)
    role: str = Field(..., description="User role (qa, qc, production, regulatory, sales, management, admin)")
    department: str = Field(..., min_length=2, max_length=100)
    
    @validator('password')
    def validate_password_strength(cls, v):
        """
        Validate password meets security requirements:
        - At least 8 characters
        - Contains uppercase letter
        - Contains lowercase letter
        - Contains number
        - Contains special character
        """
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one number')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')
        return v
    
    @validator('role')
    def validate_role(cls, v):
        """Validate role is one of the allowed values"""
        allowed_roles = ['qa', 'qc', 'production', 'regulatory', 'sales', 'management', 'admin']
        if v.lower() not in allowed_roles:
            raise ValueError(f'Role must be one of: {", ".join(allowed_roles)}')
        return v.lower()


class SignInRequest(BaseModel):
    """Request model for user login"""
    email: EmailStr
    password: str


class VerifyOTPRequest(BaseModel):
    """Request model for OTP verification"""
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)


class ForgotPasswordRequest(BaseModel):
    """Request model for forgot password"""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Request model for password reset"""
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8)
    
    @validator('new_password')
    def validate_password_strength(cls, v):
        """Validate new password meets security requirements"""
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one number')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')
        return v


class ResendOTPRequest(BaseModel):
    """Request model for OTP resend"""
    email: EmailStr


# ============================================================================
# Utility Functions
# ============================================================================

PURPOSE_TO_SUPABASE_TYPE = {
    "signup": "signup",
    "reset": "recovery",
}


def _coerce_bool(value: Any) -> bool:
    """Normalize truthy metadata values that may arrive as strings."""
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        normalized = value.strip().lower()
        return normalized in {"true", "1", "yes", "y", "t"}
    if isinstance(value, (int, float)):
        return value != 0
    return False


def _build_supabase_headers(settings) -> dict[str, str]:
    """Compose headers required for Supabase Auth REST calls."""
    return {
        "apikey": settings.SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
    }


def _user_attr(user_obj, attribute: str, default=None):
    """Safely access Supabase user attributes across dict/object formats."""
    if isinstance(user_obj, dict):
        return user_obj.get(attribute, default)
    return getattr(user_obj, attribute, default)


def _track_otp_request(email: str, purpose: str) -> None:
    """Record the latest OTP request purpose for resend handling."""
    otp_request_state[email] = {
        "purpose": purpose,
        "requested_at": datetime.utcnow(),
    }


def _record_verified_reset_token(email: str, otp: str) -> None:
    """Remember verified reset OTP hashes so password update can proceed."""
    settings = get_settings()
    verified_reset_tokens[email] = {
        "token_hash": hashlib.sha256(otp.encode()).hexdigest(),
        "expires": datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRY_MINUTES),
    }


def _ensure_reset_token_is_valid(email: str, otp: str) -> None:
    """Validate cached reset OTP before updating the password."""
    entry = verified_reset_tokens.get(email)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset verification is missing or expired. Please request a new code.",
        )
    if entry["token_hash"] != hashlib.sha256(otp.encode()).hexdigest():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code. Please request a new one.",
        )
    if datetime.utcnow() > entry["expires"]:
        verified_reset_tokens.pop(email, None)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code expired. Please request a new one.",
        )


async def send_supabase_otp(email: str, purpose: str = "signup") -> None:
    """Trigger Supabase-managed OTP email delivery for the supplied purpose."""
    supabase_type = PURPOSE_TO_SUPABASE_TYPE.get(purpose)
    if not supabase_type:
        raise ValueError(f"Unsupported OTP purpose: {purpose}")

    settings = get_settings()
    payload = {"email": email, "type": supabase_type}
    if supabase_type == "signup":
        payload["create_user"] = False

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{settings.SUPABASE_URL}/auth/v1/otp",
                headers=_build_supabase_headers(settings),
                json=payload,
            )
        response.raise_for_status()
        _track_otp_request(email, purpose)
        logger.info("Supabase OTP dispatched", email=email, purpose=purpose)
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code in {401, 403}:
            logger.error(
                "Supabase OTP dispatch unauthorized",
                email=email,
                purpose=purpose,
                status_code=exc.response.status_code,
                error=exc.response.text,
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Supabase credentials are invalid or missing. Please verify SUPABASE_SERVICE_KEY.",
            ) from exc
        logger.warning(
            "Supabase OTP dispatch rejected",
            email=email,
            purpose=purpose,
            status_code=exc.response.status_code,
            error=exc.response.text,
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to send verification code for this email. Please verify the request and try again.",
        ) from exc
    except Exception as exc:  # noqa: BLE001 - relay full context upstream
        logger.error("Supabase OTP dispatch failed", email=email, purpose=purpose, error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to send verification code. Please try again later.",
        ) from exc


async def verify_supabase_otp(email: str, otp: str, purpose: str = "signup") -> dict:
    """Verify OTP using Supabase Auth REST API and return response payload."""
    supabase_type = PURPOSE_TO_SUPABASE_TYPE.get(purpose)
    if not supabase_type:
        raise ValueError(f"Unsupported OTP purpose: {purpose}")

    settings = get_settings()
    payload = {"email": email, "token": otp, "type": supabase_type}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{settings.SUPABASE_URL}/auth/v1/verify",
                headers=_build_supabase_headers(settings),
                json=payload,
            )
        response.raise_for_status()
        body = response.json()
        logger.info("Supabase OTP verified", email=email, purpose=purpose)
        return body
    except httpx.HTTPStatusError as exc:
        logger.warning(
            "Supabase OTP verification failed",
            email=email,
            purpose=purpose,
            status_code=exc.response.status_code,
            error=exc.response.text,
        )
        return {}
    except Exception as exc:  # noqa: BLE001 - propagate failure context
        logger.error("Supabase OTP verification error", email=email, purpose=purpose, error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Verification service is unavailable. Please try again later.",
        ) from exc


# Legacy SMTP OTP helpers retained for future migrations if Supabase integration changes.
# def _legacy_generate_otp() -> str:
#     return str(secrets.randbelow(900000) + 100000)
#
# def _legacy_store_otp(email: str, otp: str, purpose: str = "signup") -> None:
#     expiry = datetime.utcnow() + timedelta(minutes=get_settings().OTP_EXPIRY_MINUTES)
#     otp_storage[email] = {"otp": otp, "expires": expiry, "purpose": purpose}
#
# async def _legacy_send_email(email: str, otp: str, purpose: str = "signup") -> None:
#     await send_otp_email(email, otp, purpose)  # Placeholder for previous SMTP flow



# ============================================================================
# Authentication Endpoints
# ============================================================================

@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(request: Request, data: SignUpRequest):
    """
    Register a new user account.
    
    Flow:
    1. Validate user doesn't already exist in Supabase
    2. Create user in Supabase authentication
    3. Ask Supabase Auth to deliver the OTP email
    4. Store user metadata (pending verification)
    
    Args:
        request: FastAPI request object
        data: User registration data
        
    Returns:
        dict: Success message with next steps
        
    Raises:
        HTTPException: 400 if email already exists
    """
    supabase = get_supabase_client()
    
    try:
        # Create user in Supabase
        auth_response = supabase.auth.admin.create_user({
            "email": data.email,
            "password": data.password,
            "email_confirm": False,  # Require email verification
            "user_metadata": {
                "name": data.name,
                "role": data.role,
                "department": data.department,
                "created_at": datetime.utcnow().isoformat(),
            }
        })

        # Delegate OTP delivery to Supabase-managed SMTP service
        await send_supabase_otp(data.email, purpose="signup")
        
        logger.info(
            "User signup initiated",
            email=data.email,
            role=data.role,
            user_id=auth_response.user.id if hasattr(auth_response, 'user') else None,
        )
        
        return {
            "message": "Registration successful. Please check your email for verification code.",
            "email": data.email,
            "requires_verification": True,
        }
        
    except AuthApiError as exc:
        message = getattr(exc, "message", "") or str(exc)
        normalized = message.lower()
        status_code = getattr(exc, "status", None)

        if status_code in {401, 403} or "not allowed" in normalized:
            logger.error("Supabase signup unauthorized", email=data.email, error=message, status=status_code)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Supabase service role key is missing or invalid. Please verify SUPABASE_SERVICE_KEY.",
            ) from exc

        if status_code in {400, 409, 422} and (
            "already registered" in normalized or "user already exists" in normalized
        ):
            logger.info(
                "Signup reuse detected; resending verification code",
                email=data.email,
                error=message,
            )
            try:
                await send_supabase_otp(data.email, purpose="signup")
            except HTTPException:
                raise

            return {
                "message": "This email is already registered. We have resent the verification code.",
                "email": data.email,
                "requires_verification": True,
                "already_registered": True,
            }

        logger.error("Supabase signup error", email=data.email, error=message, status=status_code)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration failed. Please verify the information and try again.",
        ) from exc

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Signup error", email=data.email, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed. Please try again.",
        )


@router.post("/verify-otp")
async def verify_signup_otp(request: Request, data: VerifyOTPRequest):
    """
    Verify OTP for email verification after signup.
    
    Flow:
    1. Validate OTP code
    2. Mark email as verified in Supabase
    3. Create session for user
    4. Return user data
    
    Args:
        request: FastAPI request object
        data: Email and OTP code
        
    Returns:
        dict: User information and success message
        
    Raises:
        HTTPException: 400 if OTP is invalid or expired
    """
    verification = await verify_supabase_otp(data.email, data.otp, purpose="signup")
    if not verification:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code.",
        )
    
    user_payload = verification.get("user") if isinstance(verification, dict) else None

    if not user_payload:
        logger.error("OTP verification response missing user payload", email=data.email)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Verification service did not return user information.",
        )

    try:
        otp_request_state.pop(data.email, None)

        metadata = user_payload.get("user_metadata") or {}
        session_metadata = {
            "user_id": user_payload.get("id"),
            "email": user_payload.get("email"),
            "role": metadata.get("role"),
            "name": metadata.get("name"),
            "department": metadata.get("department"),
            "has_selected_data_source": _coerce_bool(metadata.get("has_selected_data_source")),
        }

        if not session_metadata["user_id"] or not session_metadata["email"]:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Incomplete user data returned after verification.",
            )

        set_session_data(request, "user", session_metadata)

        logger.info(
            "User verified and logged in",
            email=data.email,
            user_id=session_metadata["user_id"],
        )

        return {
            "message": "Email verified successfully.",
            "user": session_metadata,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("OTP verification error", email=data.email, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Verification failed. Please try again.",
        )


@router.post("/signin")
async def signin(request: Request, data: SignInRequest):
    """
    Authenticate user and create session.
    
    Flow:
    1. Check if user exists in Supabase
    2. Verify password with Supabase authentication
    3. Create session with user data
    4. Return user information
    
    Args:
        request: FastAPI request object
        data: Email and password
        
    Returns:
        dict: User information and success message
        
    Raises:
        HTTPException: 400 if credentials are invalid
        HTTPException: 403 if email is not verified
    """
    supabase = get_supabase_client()
    
    try:
        # Authenticate with Supabase
        auth_response = supabase.auth.sign_in_with_password({
            "email": data.email,
            "password": data.password,
        })
        
        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid email or password.",
            )
        
        user = auth_response.user

        # Check if email is verified
        if not user.email_confirmed_at:
            logger.warning("Login attempt with unverified email", email=data.email)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Please verify your email before signing in.",
            )

        metadata = user.user_metadata or {}
        has_selected_data_source = _coerce_bool(metadata.get("has_selected_data_source"))

        # Fetch user data from database table (fallback to user_metadata)
        try:
            db_user = supabase.table('users').select('*').eq('email', data.email).execute()
            if db_user.data and len(db_user.data) > 0:
                user_record = db_user.data[0]
                role = user_record.get('role')
                name = user_record.get('name')
                department = user_record.get('department')
                has_selected_data_source = _coerce_bool(
                    user_record.get('has_selected_data_source', has_selected_data_source)
                )
            else:
                # Fallback to user_metadata
                role = metadata.get("role")
                name = metadata.get("name")
                department = metadata.get("department")
        except:
            # If table query fails, use user_metadata
            role = metadata.get("role")
            name = metadata.get("name")
            department = metadata.get("department")

        # Create session
        user_session = {
            "user_id": user.id,
            "email": user.email,
            "role": role,
            "name": name,
            "department": department,
            "has_selected_data_source": has_selected_data_source,
        }
        set_session_data(request, "user", user_session)
        
        logger.info("User signed in", email=data.email, user_id=user.id)
        
        return {
            "success": True,
            "message": "Sign in successful.",
            "user": user_session,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Signin error", email=data.email, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or password.",
        )


@router.post("/signout")
async def signout(request: Request, user: dict = Depends(get_current_user)):
    """
    Sign out current user and clear session.
    
    Args:
        request: FastAPI request object
        user: Current authenticated user (from dependency)
        
    Returns:
        dict: Success message
    """
    email = user.get("email")
    clear_session(request)
    
    logger.info("User signed out", email=email)
    
    return {"message": "Sign out successful."}


@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):
    """
    Initiate password reset flow.
    
    Flow:
    1. Check if user exists in Supabase
    2. Ask Supabase Auth to deliver the password reset OTP email
    
    Args:
        data: User email address
        
    Returns:
        dict: Success message
        
    Note:
        Returns success even if user doesn't exist (security best practice)
        to prevent email enumeration attacks.
    """
    try:
        await send_supabase_otp(data.email, purpose="reset")
        logger.info("Password reset OTP sent", email=data.email)
    except HTTPException as exc:
        if exc.status_code == status.HTTP_400_BAD_REQUEST:
            logger.info(
                "Password reset attempt for non-existent or unverified user",
                email=data.email,
                detail=exc.detail,
            )
            # Attempt to resend signup verification for unverified accounts
            try:
                await send_supabase_otp(data.email, purpose="signup")
                logger.info("Signup verification resent during password reset flow", email=data.email)
            except HTTPException as resend_exc:
                logger.debug(
                    "Signup OTP resend skipped during password reset fallback",
                    email=data.email,
                    detail=resend_exc.detail,
                )
        else:
            raise
    
    # Always return success to prevent email enumeration
    return {
        "message": "If an account exists with this email, you will receive a verification code.",
    }


@router.post("/verify-reset-otp")
async def verify_reset_otp(data: VerifyOTPRequest):
    """
    Verify OTP for password reset.
    
    Args:
        data: Email and OTP code
        
    Returns:
        dict: Success message
        
    Raises:
        HTTPException: 400 if OTP is invalid or expired
    """
    verification = await verify_supabase_otp(data.email, data.otp, purpose="reset")
    if not verification:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code.",
        )
    
    _record_verified_reset_token(data.email, data.otp)
    otp_request_state.pop(data.email, None)
    logger.info("Password reset OTP verified", email=data.email)
    
    return {
        "message": "Verification code confirmed. You can now reset your password.",
    }


@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest):
    """
    Reset user password after OTP verification.
    
    Flow:
    1. Confirm Supabase OTP verification recently succeeded
    2. Update password in Supabase
    3. Clear cached verification markers
    
    Args:
        data: Email, OTP, and new password
        
    Returns:
        dict: Success message
        
    Raises:
        HTTPException: 400 if OTP is invalid
        HTTPException: 404 if user not found
    """
    supabase = get_supabase_client()
    
    try:
        _ensure_reset_token_is_valid(data.email, data.otp)
    except HTTPException:
        # Fallback: re-verify OTP to recover if server state was reset.
        verification = await verify_supabase_otp(data.email, data.otp, purpose="reset")
        if not verification:
            raise
        _record_verified_reset_token(data.email, data.otp)
    
    try:
        # Get user from Supabase
        response = supabase.auth.admin.list_users()
        users = response.data if hasattr(response, 'data') else response
        
        user_data = None
        for user in users:
            if user.email == data.email:
                user_data = user
                break
        
        if not user_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )
        
        # Update password in Supabase
        supabase.auth.admin.update_user_by_id(
            user_data.id,
            {"password": data.new_password}
        )
        
        # Clean up cached verification marker
        verified_reset_tokens.pop(data.email, None)
        
        logger.info("Password reset successful", email=data.email, user_id=user_data.id)
        
        return {
            "message": "Password reset successful. You can now sign in with your new password.",
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Password reset error", email=data.email, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password reset failed. Please try again.",
        )


@router.post("/resend-otp")
async def resend_otp(data: ResendOTPRequest):
    """
    Resend OTP for email verification or password reset.
    
    Args:
        data: User email address
        
    Returns:
        dict: Success message
        
    Note:
        Determines purpose (signup vs reset) based on the cached request state.
    """
    existing_otp = otp_request_state.get(data.email)
    
    if not existing_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No pending verification found. Please start the process again.",
        )
    
    purpose = existing_otp["purpose"]
    await send_supabase_otp(data.email, purpose=purpose)
    
    logger.info("OTP resent", email=data.email, purpose=purpose)
    
    return {
        "message": "Verification code resent. Please check your email.",
    }


@router.get("/me")
async def get_current_user_info(user: dict = Depends(get_current_user)):
    """
    Get current authenticated user information.
    
    Args:
        user: Current user from session (dependency)
        
    Returns:
        dict: User information including data source selection status
    """
    return {
        "id": user.get("user_id"),
        "email": user.get("email"),
        "name": user.get("name"),
        "role": user.get("role"),
        "department": user.get("department"),
        "has_selected_data_source": user.get("has_selected_data_source", False),
        "last_login": None  # Can be added if needed
    }