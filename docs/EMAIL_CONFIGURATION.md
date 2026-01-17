# Email Configuration Guide

## Overview

The authentication system supports sending real OTP emails via SMTP. By default, it runs in **development mode** (console logging), but you can enable real email sending for production.

## Current Setup

✅ **Email sending configured** with async SMTP support  
✅ **Email verification enforced** during signin  
✅ **Beautiful HTML email templates** for OTP codes  
✅ **SMTP2GO integration** ready (since you have it configured in Supabase)

---

## Configuration Steps

### 1. Get SMTP Credentials from SMTP2GO

Since you already have SMTP2GO configured in Supabase, get your credentials:

**Option A: From Supabase Dashboard**
1. Go to Supabase Dashboard
2. Settings > Auth > SMTP Settings
3. Copy your SMTP credentials

**Option B: From SMTP2GO Directly**
1. Log in to https://www.smtp2go.com/
2. Go to Settings > Users
3. Create a new SMTP user or use existing
4. Copy the username and API key/password

### 2. Update `.env` File

```bash
# Email Configuration
SMTP_HOST=mail.smtp2go.com
SMTP_PORT=587
SMTP_USER=your-smtp2go-username-here
SMTP_PASSWORD=your-smtp2go-api-key-here
SMTP_FROM_EMAIL=noreply@eklabs.com
SMTP_FROM_NAME=EkLabs Authentication
SEND_REAL_EMAILS=True  # Change to True to enable
```

### 3. Test Configuration

**Development Mode (Current):**
- `SEND_REAL_EMAILS=False`
- OTPs logged to backend console
- No emails actually sent
- Good for testing without email credits

**Production Mode:**
- `SEND_REAL_EMAILS=True`
- Real emails sent via SMTP2GO
- OTPs still logged (for debugging)
- Requires valid SMTP credentials

---

## Email Templates

### Signup OTP Email
```
Subject: Email Verification Code
Body: Your 6-digit verification code with 10-minute expiry
```

### Password Reset Email
```
Subject: Password Reset Code  
Body: Your 6-digit password reset code with 10-minute expiry
```

Both include:
- ✅ Professional HTML design
- ✅ Large, readable OTP code
- ✅ Expiry time information
- ✅ Security disclaimer
- ✅ Plain text fallback

---

## User Flow

### Signup Flow
1. User enters email, password, name, role, department
2. Backend creates user in Supabase with `email_confirmed_at = NULL`
3. **Email sent with OTP** (console logged in dev mode)
4. User enters OTP
5. Backend verifies OTP and updates `email_confirmed_at` in Supabase
6. User can now sign in

### Signin Flow
1. User enters email and password
2. Backend checks credentials with Supabase
3. **Backend verifies email is confirmed** (`email_confirmed_at` is set)
4. If not verified → Error: "Please verify your email before signing in"
5. If verified → Session created, user logged in

### Password Reset Flow
1. User clicks "Forgot password"
2. User enters email
3. **Email sent with OTP** (console logged in dev mode)
4. User enters OTP
5. User creates new password
6. Backend updates password in Supabase
7. User can sign in with new password

---

## Testing

### Test in Development Mode (No Real Emails)

1. Start backend:
   ```bash
   cd apps/api-gateway
   uvicorn src.main:app --reload --port 8000
   ```

2. Watch terminal for OTP:
   ```
   📧 OTP Email (Development Mode) otp=123456
   ```

3. Copy OTP from terminal and use in frontend

### Test in Production Mode (Real Emails)

1. Configure SMTP credentials in `.env`

2. Enable real emails:
   ```env
   SEND_REAL_EMAILS=True
   ```

3. Restart backend

4. Signup with real email address

5. Check inbox for OTP email

---

## Troubleshooting

### Emails Not Sending

**Check `.env` configuration:**
```bash
# Verify SMTP credentials are set
SMTP_USER=your-username
SMTP_PASSWORD=your-password
SEND_REAL_EMAILS=True
```

**Check backend logs:**
```
Email sent successfully email=user@example.com purpose=signup
```

or

```
Failed to send email email=user@example.com error=...
```

### "Please verify your email" Error on Login

**Cause:** User's email not verified in Supabase

**Solution:**
1. User must complete signup OTP verification first
2. Or manually verify in Supabase Dashboard:
   - Authentication > Users
   - Find user
   - Click "..." > Confirm email

### OTP Not Received (Production Mode)

1. **Check spam folder**
2. **Verify SMTP credentials** are correct
3. **Check SMTP2GO dashboard** for sending status
4. **Check backend logs** for errors
5. **Use resend OTP** button

---

## Email Provider Alternatives

If you want to switch from SMTP2GO:

### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

### Gmail (App Password Required)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### AWS SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-aws-smtp-username
SMTP_PASSWORD=your-aws-smtp-password
```

---

## Production Checklist

Before deploying:

- [ ] Configure SMTP credentials in production `.env`
- [ ] Set `SEND_REAL_EMAILS=True`
- [ ] Set `DEBUG=False`
- [ ] Test email delivery
- [ ] Configure proper `SMTP_FROM_EMAIL` (your domain)
- [ ] Set up SPF/DKIM records for email domain
- [ ] Monitor SMTP2GO usage/credits
- [ ] Set up email rate limiting if needed

---

## Current Status

**Development Mode Active:**
- ✅ OTPs logged to console
- ✅ No email credits used
- ✅ Email verification enforced on signin
- ✅ Ready to enable real emails anytime

**To Enable Real Emails:**
1. Add SMTP credentials to `.env`
2. Set `SEND_REAL_EMAILS=True`
3. Restart backend
4. Test with real email

---

## Support

**SMTP2GO Dashboard:** https://www.smtp2go.com/  
**Supabase Auth Settings:** Your Project > Settings > Auth  
**Backend Logs:** Check uvicorn terminal for OTP codes and email status
