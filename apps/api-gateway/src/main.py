"""
EkLabs API Gateway - Main Application Entry Point

This module initializes and configures the FastAPI application with:
- CORS middleware for frontend communication
- Session middleware for authentication
- Router registration for all API endpoints
- Global exception handlers
- Startup and shutdown events

The API Gateway serves as the central authentication and routing service
for the EkLabs pharmaceutical intelligence platform.
"""

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.middleware.sessions import SessionMiddleware
import structlog

from .routers import auth, users
from .dependencies import get_settings

# Initialize structured logging
logger = structlog.get_logger()

# Get application settings
settings = get_settings()

# Initialize FastAPI application
app = FastAPI(
    title="EkLabs API Gateway",
    description="Authentication and API Gateway for EkLabs Pharmaceutical Intelligence Platform",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,  # Disable docs in production
    redoc_url="/redoc" if settings.DEBUG else None,
)

# Configure CORS (Cross-Origin Resource Sharing)
# Allows frontend to communicate with backend from different origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,  # Frontend URLs
    allow_credentials=True,  # Allow cookies and auth headers
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Configure session middleware for cookie-based authentication
# Uses itsdangerous to sign session cookies securely
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SESSION_SECRET_KEY,
    session_cookie="eklabs_session",  # Cookie name
    max_age=settings.SESSION_MAX_AGE,  # Session expiry (seconds)
    same_site="lax",  # CSRF protection
    https_only=not settings.DEBUG,  # Require HTTPS in production
)


# ============================================================================
# Exception Handlers
# ============================================================================

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Handle validation errors from Pydantic models.
    Returns user-friendly error messages for invalid request data.
    """
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Invalid request data",
            "errors": exc.errors(),
        },
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler for unexpected errors.
    Logs error details and returns generic error message to client.
    """
    logger.error(
        "Unhandled exception",
        exc_type=type(exc).__name__,
        exc_message=str(exc),
        path=request.url.path,
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )


# ============================================================================
# Lifecycle Events
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """
    Application startup event.
    Initialize connections, load configurations, etc.
    """
    logger.info(
        "Starting EkLabs API Gateway",
        version="1.0.0",
        debug=settings.DEBUG,
    )


@app.on_event("shutdown")
async def shutdown_event():
    """
    Application shutdown event.
    Cleanup resources, close connections, etc.
    """
    logger.info("Shutting down EkLabs API Gateway")


# ============================================================================
# Router Registration
# ============================================================================

# Authentication routes (/api/auth/*)
app.include_router(
    auth.router,
    prefix="/api/auth",
    tags=["Authentication"],
)

# User routes (/api/users/*)
app.include_router(
    users.router,
    prefix="/api/users",
    tags=["Users"],
)


# ============================================================================
# Health Check Endpoint
# ============================================================================

@app.get("/health", tags=["System"])
async def health_check():
    """
    Health check endpoint for monitoring and load balancers.
    Returns current application status.
    """
    return {
        "status": "healthy",
        "service": "eklabs-api-gateway",
        "version": "1.0.0",
    }


@app.get("/", tags=["System"])
async def root():
    """
    Root endpoint with API information.
    """
    return {
        "service": "EkLabs API Gateway",
        "version": "1.0.0",
        "documentation": "/docs" if settings.DEBUG else None,
    }