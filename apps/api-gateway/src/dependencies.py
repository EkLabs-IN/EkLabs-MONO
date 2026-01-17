"""
Application Dependencies

This module provides dependency injection functions for FastAPI endpoints:
- Settings management with environment variable loading
- Supabase client initialization
- Redis client for session storage
- Current user extraction from session
- Authentication verification

All dependencies are cached using functools.lru_cache for efficiency.
"""

from functools import lru_cache
from typing import Optional, Dict, Any, Union
import os

from fastapi import Depends, HTTPException, Request, status
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from supabase import Client, create_client
import structlog

logger = structlog.get_logger()


# ============================================================================
# Application Settings
# ============================================================================

class Settings(BaseSettings):
    """
    Application configuration loaded from environment variables.
    
    Environment variables should be defined in .env file:
    - SUPABASE_URL: Your Supabase project URL
    - SUPABASE_SERVICE_KEY: Supabase service role key (admin access)
    - SESSION_SECRET_KEY: Secret key for signing session cookies
    - ALLOWED_ORIGINS: Comma-separated list of allowed frontend URLs
    - DEBUG: Enable debug mode (default: False)
    """
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )
    
    # Supabase configuration
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str  # Service role key for backend operations
    
    # Session configuration
    SESSION_SECRET_KEY: str
    SESSION_MAX_AGE: int = 86400 * 7  # 7 days in seconds
    
    # Security configuration  
    ALLOWED_ORIGINS: Union[str, list[str]] = "http://localhost:8080,http://localhost:3000"
    
    # Application configuration
    DEBUG: bool = False
    
    # OTP configuration
    OTP_EXPIRY_MINUTES: int = 10
    
    # Email configuration
    SMTP_HOST: str = "mail.smtp2go.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "noreply@eklabs.com"
    SMTP_FROM_NAME: str = "EkLabs Authentication"
    SEND_REAL_EMAILS: bool = False
    
    @field_validator('ALLOWED_ORIGINS', mode='before')
    @classmethod
    def parse_origins(cls, v):
        """
        Parse ALLOWED_ORIGINS from comma-separated string or list.
        Supports both formats:
        - Comma-separated: "http://localhost:8080,http://localhost:3000"
        - JSON array: ["http://localhost:8080", "http://localhost:3000"]
        """
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',')]
        return v


@lru_cache()
def get_settings() -> Settings:
    """
    Get application settings.
    Cached to avoid reloading environment variables on every request.
    
    Returns:
        Settings: Application configuration object
    """
    return Settings()


# ============================================================================
# Supabase Client
# ============================================================================

@lru_cache()
def get_supabase_client() -> Client:
    """
    Get Supabase client instance.
    Uses service role key for full administrative access.
    
    This client can bypass Row Level Security (RLS) policies,
    so use carefully and validate all operations.
    
    Returns:
        Client: Authenticated Supabase client
    """
    settings = get_settings()
    return create_client(
        supabase_url=settings.SUPABASE_URL,
        supabase_key=settings.SUPABASE_SERVICE_KEY,
    )


# ============================================================================
# Session Management
# ============================================================================

def get_session_data(request: Request) -> Dict[str, Any]:
    """
    Extract session data from request.
    
    Args:
        request: FastAPI request object containing session
        
    Returns:
        dict: Session data dictionary (may be empty if no session)
    """
    return dict(request.session)


def set_session_data(request: Request, key: str, value: Any) -> None:
    """
    Store data in session.
    
    Args:
        request: FastAPI request object
        key: Session key
        value: Value to store (must be JSON-serializable)
    """
    request.session[key] = value


def clear_session(request: Request) -> None:
    """
    Clear all session data (logout).
    
    Args:
        request: FastAPI request object
    """
    request.session.clear()


# ============================================================================
# Authentication Dependencies
# ============================================================================

async def get_current_user(request: Request) -> Dict[str, Any]:
    """
    Extract current authenticated user from session.
    
    This dependency should be used on protected endpoints to ensure
    the user is authenticated before accessing resources.
    
    Args:
        request: FastAPI request object with session
        
    Returns:
        dict: User information from session containing:
            - user_id: Supabase user ID
            - email: User email address
            - role: User role (qa, qc, production, etc.)
            - metadata: Additional user metadata
            
    Raises:
        HTTPException: 401 if user is not authenticated
        
    Example:
        @app.get("/protected")
        async def protected_route(user: dict = Depends(get_current_user)):
            return {"message": f"Hello {user['email']}"}
    """
    session_data = get_session_data(request)
    user = session_data.get("user")
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Please sign in.",
        )
    
    return user


async def get_current_user_optional(request: Request) -> Optional[Dict[str, Any]]:
    """
    Extract current user from session (optional).
    
    Similar to get_current_user, but returns None instead of raising
    an exception if user is not authenticated. Useful for endpoints
    that have different behavior for authenticated vs anonymous users.
    
    Args:
        request: FastAPI request object
        
    Returns:
        dict or None: User information or None if not authenticated
        
    Example:
        @app.get("/public")
        async def public_route(user: dict | None = Depends(get_current_user_optional)):
            if user:
                return {"message": f"Hello {user['email']}"}
            return {"message": "Hello guest"}
    """
    session_data = get_session_data(request)
    return session_data.get("user")


# ============================================================================
# Utility Functions
# ============================================================================

# def verify_user_exists_in_supabase(email: str) -> bool:
#     """
#     Check if a user exists in Supabase authentication.
    
#     Args:
#         email: User email address
        
#     Returns:
#         bool: True if user exists, False otherwise
        
#     Note:
#         This function requires service role key to access user list.
#     """
#     try:
#         supabase = get_supabase_client()
        
#         # Query Supabase auth.users table via admin API
#         response = supabase.auth.admin.list_users()
        
#         if hasattr(response, 'data'):
#             users = response.data
#         else:
#             users = response
        
#         # Check if email exists in user list
#         for user in users:
#             if user.email == email:
#                 return True
                
#         return False
        
#     except Exception as e:
#         logger.error("Error checking user existence", email=email, error=str(e))
#         return False

# ...existing code...

def verify_user_exists_in_supabase(email: str) -> bool:
    """
    Check if a user exists in Supabase by email.
    
    Args:
        email: User email to check
        
    Returns:
        bool: True if user exists, False otherwise
    """
    try:
        supabase = get_supabase_client()
        
        # Try to list users and find matching email
        response = supabase.auth.admin.list_users()
        
        # Handle different response formats
        if hasattr(response, 'data'):
            users = response.data
        elif hasattr(response, 'users'):
            users = response.users
        else:
            users = response if isinstance(response, list) else []
        
        # Check if any user has matching email
        for user in users:
            if hasattr(user, 'email') and user.email == email:
                return True
        
        return False
        
    except Exception as e:
        logger.error("Error checking user existence", email=email, error=str(e))
        # On error, return False to allow signup attempt
        # Supabase will handle duplicate email check
        return False

