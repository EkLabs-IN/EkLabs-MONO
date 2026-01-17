# Authentication Quick Reference

## 🚀 Quick Start (5 minutes)

### 1. Backend Setup
```bash
cd apps/api-gateway
pip install -r requirements.txt
cp .env.example .env
# Edit .env with Supabase credentials
uvicorn src.main:app --reload --port 8000
```

### 2. Frontend (Already Configured)
```bash
cd apps/web-dashboard
npm run dev  # http://localhost:8080 or 8081
```

---

## 📡 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/signup` | Register user | No |
| POST | `/api/auth/verify-otp` | Verify email | No |
| POST | `/api/auth/signin` | Login | No |
| POST | `/api/auth/signout` | Logout | Yes |
| POST | `/api/auth/forgot-password` | Request reset | No |
| POST | `/api/auth/verify-reset-otp` | Verify reset code | No |
| POST | `/api/auth/reset-password` | Update password | No |
| POST | `/api/auth/resend-otp` | Resend code | No |
| GET | `/api/auth/me` | Get user info | Yes |

---

## 🔑 Environment Variables

### Backend (.env)
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...
SESSION_SECRET_KEY=random_32_chars
ALLOWED_ORIGINS=http://localhost:8080
DEBUG=True
```

### Frontend (already in .env)
```bash
VITE_API_URL=http://localhost:8000/api
```

---

## 🧪 Testing

### Sign Up Test
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

### Check Console for OTP → Use in verification

### Verify OTP
```bash
curl -X POST http://localhost:8000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "otp": "123456"}'
```

---

## 🔒 Password Rules

- ✅ Minimum 8 characters
- ✅ At least one uppercase letter
- ✅ At least one lowercase letter
- ✅ At least one number
- ✅ At least one special character

---

## 📝 Code Examples

### Protected Endpoint (Backend)
```python
from fastapi import Depends
from src.dependencies import get_current_user

@router.get("/protected")
async def protected_route(user: dict = Depends(get_current_user)):
    return {"message": f"Hello {user['email']}"}
```

### API Call (Frontend)
```typescript
const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/signin`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',  // Important for cookies!
  body: JSON.stringify({ email, password }),
});
```

---

## 🐛 Troubleshooting

### "Not authenticated" error
- Check session cookie is being sent (`credentials: 'include'`)
- Verify CORS allows credentials
- Check session hasn't expired

### "User already exists"
- Check Supabase dashboard for existing user
- Delete user or use different email

### "Invalid OTP"
- OTP expires after 10 minutes
- Check backend console for generated OTP (dev mode)
- Use resend OTP endpoint

### CORS errors
- Add frontend URL to `ALLOWED_ORIGINS`
- Ensure `credentials: 'include'` in fetch
- Check browser console for specific error

---

## 📚 Documentation

- **Complete Guide**: `docs/AUTHENTICATION.md`
- **Implementation**: `docs/IMPLEMENTATION_SUMMARY.md`
- **API Docs**: http://localhost:8000/docs (when running)
- **Backend README**: `apps/api-gateway/README.md`

---

## 🎯 User Roles

Valid roles for signup:
- `qa` - Quality Assurance
- `qc` - Quality Control
- `production` - Production
- `regulatory` - Regulatory Affairs
- `sales` - Sales & Marketing
- `management` - Management
- `admin` - System Administrator

---

## ⚡ Common Commands

```bash
# Generate session secret
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Run backend with auto-reload
uvicorn src.main:app --reload --port 8000

# Install backend dependencies
pip install -r requirements.txt

# Run frontend dev server
npm run dev
```

---

## 📊 Session Info

- **Storage**: HTTP-only cookies
- **Expiry**: 7 days (default)
- **Security**: SameSite=Lax, signed with secret
- **HTTPS Only**: Production only (disabled in dev)

---

## 🔐 Security Features

✅ Bcrypt password hashing (via Supabase)  
✅ Session-based authentication  
✅ CSRF protection (SameSite cookies)  
✅ OTP email verification  
✅ Rate limiting ready  
✅ Audit logging  
✅ Email enumeration prevention  
✅ Input validation (Pydantic)  

---

**Need Help?** Check `docs/AUTHENTICATION.md` for detailed documentation.
