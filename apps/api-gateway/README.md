# EkLabs API Gateway

FastAPI-based authentication and API gateway for the EkLabs pharmaceutical intelligence platform.

## Features

- 🔐 **Session-Based Authentication**: Secure cookie-based sessions
- 👤 **User Management**: Supabase integration for user storage
- ✉️ **Email Verification**: OTP-based email confirmation
- 🔑 **Password Reset**: Secure forgot password flow with OTP
- 📝 **Comprehensive Logging**: Structured logging with context
- 🛡️ **Security Best Practices**: Password hashing, CSRF protection, HTTPS
- 📚 **API Documentation**: Auto-generated with FastAPI

## Quick Start

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

3. **Run development server:**
   ```bash
   uvicorn src.main:app --reload --port 8000
   ```

4. **Access documentation:**
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

## Project Structure

```
apps/api-gateway/
├── src/
│   ├── __init__.py          # Package initialization
│   ├── main.py              # FastAPI app initialization
│   ├── dependencies.py      # Dependency injection (settings, auth)
│   ├── routers/             # API route handlers
│   │   ├── __init__.py
│   │   ├── auth.py          # Authentication endpoints
│   │   ├── chat.py          # Chat interface (to be implemented)
│   │   └── ingestion.py     # Data ingestion (to be implemented)
│   └── middleware/          # Custom middleware
│       └── .gitkeep
├── requirements.txt         # Python dependencies
├── .env.example            # Environment variables template
└── Dockerfile              # Container configuration
```

## Environment Variables

Required environment variables (see `.env.example`):

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | `eyJhbGc...` |
| `SESSION_SECRET_KEY` | Secret for session signing | `random_string_32_chars` |
| `ALLOWED_ORIGINS` | Frontend URLs (comma-separated) | `http://localhost:8080` |
| `DEBUG` | Enable debug mode | `True` or `False` |
| `OTP_EXPIRY_MINUTES` | OTP validity period | `10` |

## API Endpoints

### Authentication (`/api/auth`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/signup` | POST | Register new user | No |
| `/verify-otp` | POST | Verify email with OTP | No |
| `/signin` | POST | Sign in with credentials | No |
| `/signout` | POST | Sign out current user | Yes |
| `/forgot-password` | POST | Request password reset | No |
| `/verify-reset-otp` | POST | Verify reset OTP | No |
| `/reset-password` | POST | Reset password | No |
| `/resend-otp` | POST | Resend OTP code | No |
| `/me` | GET | Get current user info | Yes |

See [docs/AUTHENTICATION.md](../../docs/AUTHENTICATION.md) for detailed documentation.

## Development

### Running Tests
```bash
pytest tests/
```

### Code Formatting
```bash
black src/
isort src/
```

### Type Checking
```bash
mypy src/
```

## Deployment

### Docker
```bash
docker build -t eklabs-api-gateway .
docker run -p 8000:8000 --env-file .env eklabs-api-gateway
```

### Production Checklist
- Set `DEBUG=False`
- Use strong session secret
- Configure HTTPS
- Set up Redis for sessions
- Configure email service
- Enable rate limiting
- Set up monitoring

## Security

- **Password Requirements**: 8+ chars, uppercase, lowercase, number, special char
- **Session Security**: HTTP-only cookies, SameSite protection
- **OTP Security**: 6-digit codes, 10-minute expiry
- **CORS**: Configured for specific frontend origins
- **Audit Logging**: All auth events logged with structured logging

## Architecture

### Session Management
- Uses `SessionMiddleware` from Starlette
- Session data stored in signed cookies
- User information cached in session after login
- Protected endpoints verify session before access

### Supabase Integration
- Backend uses service role key for admin operations
- User creation with metadata (role, department, name)
- Email verification flag management
- Password authentication via Supabase Auth

### OTP Workflow
- In-memory storage (dev) - use Redis in production
- Purpose-specific (signup vs password reset)
- Time-based expiry with cleanup
- Console logging in dev, email in production

## Dependencies

Key dependencies:
- **FastAPI**: Modern web framework
- **Supabase**: User authentication and storage
- **Passlib**: Password hashing with bcrypt
- **python-jose**: JWT handling (for future use)
- **Pydantic**: Data validation
- **structlog**: Structured logging

See `requirements.txt` for complete list.

## Contributing

1. Follow FastAPI best practices
2. Add comprehensive docstrings
3. Use type hints
4. Include error handling
5. Log important events
6. Update documentation

## License

Proprietary - EkLabs
