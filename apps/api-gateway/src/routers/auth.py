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
from typing import Optional
import secrets
import re

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr, Field, validator
from passlib.context import CryptContext
import structlog

from ..dependencies import (
    get_settings,
    get_supabase_client,
    get_current_user,
    get_current_user_optional,
    set_session_data,
    clear_session,
    verify_user_exists_in_supabase,
)

# Initialize router
router = APIRouter()

# Initialize logger
logger = structlog.get_logger()

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# In-memory OTP storage (in production, use Redis)
# Structure: {email: {"otp": "123456", "expires": datetime, "purpose": "signup|reset"}}
otp_storage: dict[str, dict] = {}


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

def generate_otp() -> str:
    """
    Generate a secure 6-digit OTP code.
    
    Returns:
        str: 6-digit OTP code
    """
    return str(secrets.randbelow(900000) + 100000)


def store_otp(email: str, otp: str, purpose: str = "signup") -> None:
    """
    Store OTP in memory with expiration time.
    
    Args:
        email: User email address
        otp: Generated OTP code
        purpose: OTP purpose (signup, reset)
    """
    settings = get_settings()
    expiry = datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)
    
    otp_storage[email] = {
        "otp": otp,
        "expires": expiry,
        "purpose": purpose,
    }
    
    logger.info(
        "OTP stored",
        email=email,
        purpose=purpose,
        expires=expiry.isoformat(),
    )


def verify_otp(email: str, otp: str, purpose: str = "signup") -> bool:
    """
    Verify OTP code for given email.
    
    Args:
        email: User email address
        otp: OTP code to verify
        purpose: Expected purpose (signup, reset)
        
    Returns:
        bool: True if OTP is valid and not expired
    """
    stored_otp_data = otp_storage.get(email)
    
    if not stored_otp_data:
        logger.warning("OTP verification failed: no OTP found", email=email)
        return False
    
    # Check if OTP matches
    if stored_otp_data["otp"] != otp:
        logger.warning("OTP verification failed: incorrect code", email=email)
        return False
    
    # Check if OTP purpose matches
    if stored_otp_data["purpose"] != purpose:
        logger.warning(
            "OTP verification failed: purpose mismatch",
            email=email,
            expected=purpose,
            actual=stored_otp_data["purpose"],
        )
        return False
    
    # Check if OTP has expired
    if datetime.utcnow() > stored_otp_data["expires"]:
        logger.warning("OTP verification failed: expired", email=email)
        del otp_storage[email]  # Clean up expired OTP
        return False
    
    return True


async def send_otp_email(email: str, otp: str, purpose: str = "signup") -> None:
    """
    Send OTP via email using SMTP.
    
    Sends email in production mode or logs to console in development.
    Uses SMTP2GO or configured SMTP server.
    
    Args:
        email: Recipient email address
        otp: OTP code to send
        purpose: Email purpose (signup, reset)
    """
    settings = get_settings()
    
    # Always log OTP in development mode or when real emails are disabled
    if settings.DEBUG or not settings.SEND_REAL_EMAILS:
        logger.info(
            "📧 OTP Email (Development Mode)",
            email=email,
            otp=otp,
            purpose=purpose,
            message=f"Your verification code is: {otp}",
        )
    
    # Send real email if configured
    if settings.SEND_REAL_EMAILS and settings.SMTP_USER and settings.SMTP_PASSWORD:
        try:
            import aiosmtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            
            # Email subject based on purpose
            subject = "Email Verification Code" if purpose == "signup" else "Password Reset Code"
            
            # Create HTML email
            message = MIMEMultipart("alternative")
            message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
            message["To"] = email
            message["Subject"] = subject
            
            # HTML body
            html_body = f"""
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #4f46e5;">EkLabs Authentication</h2>
                  <p>Your verification code is:</p>
                  <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                    <h1 style="color: #4f46e5; margin: 0; font-size: 36px; letter-spacing: 8px;">{otp}</h1>
                  </div>
                  <p>This code will expire in {settings.OTP_EXPIRY_MINUTES} minutes.</p>
                  <p style="color: #6b7280; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
                  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                  <p style="color: #9ca3af; font-size: 12px;">This is an automated message, please do not reply.</p>
                </div>
              </body>
            </html>
            """
            
            # Text body (fallback)
            text_body = f"""
            EkLabs Authentication
            
            Your verification code is: {otp}
            
            This code will expire in {settings.OTP_EXPIRY_MINUTES} minutes.
            
            If you didn't request this code, please ignore this email.
            """
            
            message.attach(MIMEText(text_body, "plain"))
            message.attach(MIMEText(html_body, "html"))
            
            # Send email via SMTP
            await aiosmtplib.send(
                message,
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                username=settings.SMTP_USER,
                password=settings.SMTP_PASSWORD,
                start_tls=True,
            )
            
            logger.info("Email sent successfully", email=email, purpose=purpose)
            
        except Exception as e:
            logger.error("Failed to send email", email=email, error=str(e))
            # Don't raise exception - continue with OTP stored in system
            # User can still use it if they check logs or use resend


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
    3. Generate and send OTP for email verification
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
        # Check if user already exists in Supabase
        if verify_user_exists_in_supabase(data.email):
            logger.warning("Signup attempt with existing email", email=data.email)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email already exists. Please sign in.",
            )
        
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
        
        # Generate and store OTP
        otp = generate_otp()
        store_otp(data.email, otp, purpose="signup")
        
        # Send OTP via email
        await send_otp_email(data.email, otp, purpose="signup")
        
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
    supabase = get_supabase_client()
    
    # Verify OTP
    if not verify_otp(data.email, data.otp, purpose="signup"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code.",
        )
    
    try:
        # Get user from Supabase by email
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
        
        # Update user to mark email as verified
        supabase.auth.admin.update_user_by_id(
            user_data.id,
            {"email_confirm": True}
        )
        
        # Clean up OTP
        del otp_storage[data.email]
        
        # Create session
        user_session = {
            "user_id": user_data.id,
            "email": user_data.email,
            "role": user_data.user_metadata.get("role"),
            "name": user_data.user_metadata.get("name"),
            "department": user_data.user_metadata.get("department"),
        }
        set_session_data(request, "user", user_session)
        
        logger.info("User verified and logged in", email=data.email, user_id=user_data.id)
        
        return {
            "message": "Email verified successfully.",
            "user": user_session,
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
        
        # Create session
        user_session = {
            "user_id": user.id,
            "email": user.email,
            "role": user.user_metadata.get("role"),
            "name": user.user_metadata.get("name"),
            "department": user.user_metadata.get("department"),
            "has_selected_data_source": user.user_metadata.get("has_selected_data_source", False),
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
    2. Generate OTP for password reset
    3. Send OTP via email
    
    Args:
        data: User email address
        
    Returns:
        dict: Success message
        
    Note:
        Returns success even if user doesn't exist (security best practice)
        to prevent email enumeration attacks.
    """
    # Check if user exists
    user_exists = verify_user_exists_in_supabase(data.email)
    
    if user_exists:
        # Generate and store OTP
        otp = generate_otp()
        store_otp(data.email, otp, purpose="reset")
        
        # Send OTP via email
        await send_otp_email(data.email, otp, purpose="reset")
        
        logger.info("Password reset OTP sent", email=data.email)
    else:
        # Log but don't reveal user doesn't exist
        logger.info("Password reset attempt for non-existent user", email=data.email)
    
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
    if not verify_otp(data.email, data.otp, purpose="reset"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code.",
        )
    
    logger.info("Password reset OTP verified", email=data.email)
    
    return {
        "message": "Verification code confirmed. You can now reset your password.",
    }


@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest):
    """
    Reset user password after OTP verification.
    
    Flow:
    1. Verify OTP one final time
    2. Update password in Supabase
    3. Clean up OTP
    
    Args:
        data: Email, OTP, and new password
        
    Returns:
        dict: Success message
        
    Raises:
        HTTPException: 400 if OTP is invalid
        HTTPException: 404 if user not found
    """
    supabase = get_supabase_client()
    
    # Verify OTP
    if not verify_otp(data.email, data.otp, purpose="reset"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code.",
        )
    
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
        
        # Clean up OTP
        del otp_storage[data.email]
        
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
        Determines purpose (signup vs reset) based on existing OTP in storage.
    """
    # Check if there's an existing OTP
    existing_otp = otp_storage.get(data.email)
    
    if not existing_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No pending verification found. Please start the process again.",
        )
    
    purpose = existing_otp["purpose"]
    
    # Generate new OTP
    otp = generate_otp()
    store_otp(data.email, otp, purpose=purpose)
    
    # Send OTP
    await send_otp_email(data.email, otp, purpose=purpose)
    
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