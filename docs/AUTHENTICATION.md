# EkLabs API Gateway - Authentication System

## Overview

Session-based authentication system with Supabase integration for the EkLabs pharmaceutical intelligence platform.

## Architecture

### Components

1. **FastAPI Backend** (`apps/api-gateway`)
   - Session-based authentication with secure cookies
   - Supabase integration for user management
   - OTP verification for email confirmation and password reset
   - Comprehensive audit logging

2. **React Frontend** (`apps/web-dashboard`)
   - Sign In / Sign Up forms
   - OTP verification UI
   - Forgot password flow with OTP
   - Session management

### Authentication Flow

#### Sign Up Flow
```
1. User fills registration form → POST /api/auth/signup
2. Backend creates user in Supabase (email_confirmed=false)
3. Backend generates 6-digit OTP, stores in memory
4. Backend sends OTP to user email (logged in dev mode)
5. User enters OTP → POST /api/auth/verify-otp
6. Backend verifies OTP, marks email as confirmed
7. Backend creates session, returns user data
8. User redirected to dashboard
```

#### Sign In Flow
```
1. User enters credentials → POST /api/auth/signin
2. Backend checks if user exists in Supabase
3. Backend verifies password with Supabase auth
4. Backend checks email is verified
5. Backend creates session with user data
6. User redirected to dashboard
```

#### Forgot Password Flow
```
1. User enters email → POST /api/auth/forgot-password
2. Backend checks if user exists (doesn't reveal if not)
3. Backend generates OTP for password reset
4. Backend sends OTP to email
5. User enters OTP → POST /api/auth/verify-reset-otp
6. Backend verifies OTP
7. User creates new password → POST /api/auth/reset-password
8. Backend updates password in Supabase
9. User can sign in with new password
```

## Setup Instructions

### Backend Setup

1. **Install Dependencies**
   ```bash
   cd apps/api-gateway
   pip install -r requirements.txt
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_KEY`: Service role key (from Supabase settings)
   - `SESSION_SECRET_KEY`: Random string for session signing
   - `ALLOWED_ORIGINS`: Frontend URLs (comma-separated)

3. **Generate Session Secret**
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

4. **Run Development Server**
   ```bash
   uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
   ```

5. **Access API Documentation**
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

### Frontend Setup

Frontend is already configured. Just ensure:
- `.env` has correct `VITE_API_URL=http://localhost:8000/api`
- Supabase credentials are set for direct client access (optional)

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/signup
Register new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "role": "qa",
  "department": "Quality Assurance"
}
```

**Response:**
```json
{
  "message": "Registration successful. Please check your email for verification code.",
  "email": "user@example.com",
  "requires_verification": true
}
```

#### POST /api/auth/verify-otp
Verify email with OTP after signup.

**Request:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "message": "Email verified successfully.",
  "user": {
    "user_id": "uuid",
    "email": "user@example.com",
    "role": "qa",
    "name": "John Doe",
    "department": "Quality Assurance"
  }
}
```

#### POST /api/auth/signin
Sign in with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "message": "Sign in successful.",
  "user": {
    "user_id": "uuid",
    "email": "user@example.com",
    "role": "qa",
    "name": "John Doe",
    "department": "Quality Assurance"
  }
}
```

#### POST /api/auth/signout
Sign out current user (requires authentication).

**Response:**
```json
{
  "message": "Sign out successful."
}
```

#### POST /api/auth/forgot-password
Request password reset OTP.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "If an account exists with this email, you will receive a verification code."
}
```

#### POST /api/auth/verify-reset-otp
Verify OTP for password reset.

**Request:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "message": "Verification code confirmed. You can now reset your password."
}
```

#### POST /api/auth/reset-password
Reset password with verified OTP.

**Request:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "new_password": "NewSecurePass123!"
}
```

**Response:**
```json
{
  "message": "Password reset successful. You can now sign in with your new password."
}
```

#### POST /api/auth/resend-otp
Resend OTP code.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Verification code resent. Please check your email."
}
```

#### GET /api/auth/me
Get current user information (requires authentication).

**Response:**
```json
{
  "user": {
    "user_id": "uuid",
    "email": "user@example.com",
    "role": "qa",
    "name": "John Doe",
    "department": "Quality Assurance"
  }
}
```

## Security Features

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Session Security
- HTTP-only session cookies
- Secure flag in production (HTTPS only)
- SameSite=Lax for CSRF protection
- 7-day default expiry (configurable)

### OTP Security
- 6-digit random codes
- 10-minute expiry (configurable)
- Purpose-specific (signup vs reset)
- One-time use

### Supabase Integration
- Service role key for backend operations
- Row Level Security (RLS) bypass for admin operations
- Email confirmation required for signin
- Secure password storage with bcrypt

## Error Handling

All endpoints return consistent error responses:

```json
{
  "detail": "Error message"
}
```

Common HTTP status codes:
- `200 OK`: Successful request
- `201 Created`: User created successfully
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Email not verified
- `404 Not Found`: User not found
- `422 Unprocessable Entity`: Validation errors
- `500 Internal Server Error`: Server error

## Development Notes

### OTP Storage
Currently using in-memory dictionary for OTP storage. For production:
- Use Redis for distributed storage
- Implement TTL (time-to-live) for automatic cleanup
- Consider rate limiting to prevent abuse

### Email Service
Development mode logs OTP to console. For production:
- Integrate SendGrid, AWS SES, or similar service
- Implement email templates
- Add email delivery tracking
- Handle bounces and failures

### Database
Backend checks user existence via Supabase Auth API. Consider:
- Caching frequently accessed user data
- Using database client for custom user metadata
- Implementing user profile management endpoints

## Testing

### Manual Testing

1. **Test Sign Up:**
   ```bash
   curl -X POST http://localhost:8000/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "Test123!",
       "name": "Test User",
       "role": "qa",
       "department": "QA"
     }'
   ```
   
   Check console for OTP code.

2. **Test OTP Verification:**
   ```bash
   curl -X POST http://localhost:8000/api/auth/verify-otp \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com", "otp": "123456"}'
   ```

3. **Test Sign In:**
   ```bash
   curl -X POST http://localhost:8000/api/auth/signin \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com", "password": "Test123!"}'
   ```

## Deployment

### Production Checklist
- [ ] Set `DEBUG=False` in environment
- [ ] Use strong `SESSION_SECRET_KEY`
- [ ] Configure HTTPS-only cookies
- [ ] Set up Redis for session/OTP storage
- [ ] Configure email service (SendGrid/SES)
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Configure CORS for production domain
- [ ] Review and test all security headers
- [ ] Set up database backups

### Docker Deployment
```bash
cd apps/api-gateway
docker build -t eklabs-api-gateway .
docker run -p 8000:8000 --env-file .env eklabs-api-gateway
```

## Troubleshooting

### Common Issues

1. **"User already exists" error on signup**
   - Check Supabase dashboard for existing user
   - User might have unverified email - resend OTP or delete and retry

2. **"Invalid or expired OTP"**
   - OTP expires after 10 minutes
   - Request new OTP with resend endpoint
   - Check server logs for generated OTP (dev mode)

3. **"Not authenticated" on protected endpoints**
   - Ensure session cookie is being sent
   - Check CORS configuration allows credentials
   - Verify session hasn't expired

4. **CORS errors**
   - Add frontend URL to `ALLOWED_ORIGINS`
   - Ensure `allow_credentials=True` in CORS config
   - Check browser dev tools for specific error

## Support

For issues or questions:
1. Check server logs for detailed error messages
2. Review API documentation at `/docs`
3. Verify environment configuration
4. Check Supabase dashboard for user status
