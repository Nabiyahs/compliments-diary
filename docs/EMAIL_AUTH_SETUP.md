# Email + Password Authentication Setup Guide

This document provides a complete guide for setting up email + password authentication with Supabase.

## How It Works

1. **Sign Up**: User enters email + password → confirmation email sent → user clicks link → account activated
2. **Sign In**: User enters email + password → authenticated immediately
3. **Password Reset**: User requests reset → email sent → user clicks link → sets new password

This approach is:
- **Standard**: Traditional email/password flow users are familiar with
- **Secure**: Email confirmation required, password hashing handled by Supabase
- **Cookie-based**: Sessions stored in HTTP-only cookies for SSR compatibility

---

## Prerequisites

- Supabase project
- Vercel deployment (or localhost for development)
- Valid email configuration in Supabase (default SMTP works for testing)

---

## 1. Supabase Dashboard Setup

### 1.1 Enable Email Provider

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** > **Providers**
4. Find **Email** and ensure it is **enabled**
5. Configure options:
   - **Confirm email**: **ON** (recommended for production)
   - **Secure email change**: ON
   - **Enable signup**: ON

### 1.2 Configure URL Settings

1. Go to **Authentication** > **URL Configuration**
2. Set **Site URL**:
   - For development: `http://localhost:3000`
   - For production: `https://your-vercel-domain.vercel.app`
3. Add **Redirect URLs** (one per line):

```
http://localhost:3000/auth/callback
http://localhost:3000/auth/reset
https://your-vercel-domain.vercel.app/auth/callback
https://your-vercel-domain.vercel.app/auth/reset
```

> **Important**: Both `/auth/callback` (for email confirmation) and `/auth/reset` (for password reset) must be included.

### 1.3 Configure Email Templates (Optional)

1. Go to **Authentication** > **Email Templates**
2. Customize these templates:
   - **Confirm signup**: Sent when user signs up
   - **Reset password**: Sent when user requests password reset
   - **Change email address**: Sent when user changes email

---

## 2. Environment Variables

### 2.1 Local Development (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 2.2 Vercel Environment Variables

1. Go to Vercel Dashboard > Your Project > Settings > Environment Variables
2. Add:
   - `NEXT_PUBLIC_SUPABASE_URL` = Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your Supabase anon key

---

## 3. Verification Checklist

### Supabase Dashboard
- [ ] Email provider enabled
- [ ] "Confirm email" setting is ON
- [ ] Site URL configured correctly
- [ ] Redirect URLs include:
  - [ ] `http://localhost:3000/auth/callback` (development)
  - [ ] `http://localhost:3000/auth/reset` (development)
  - [ ] `https://your-domain.vercel.app/auth/callback` (production)
  - [ ] `https://your-domain.vercel.app/auth/reset` (production)

### Environment Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL` set correctly
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set correctly

---

## 4. Testing

### Local Testing - Sign Up Flow

1. Run `npm run dev`
2. Go to `http://localhost:3000/login`
3. Click the "Sign up" tab
4. Enter email + password + confirm password
5. Click "Create account"
6. Check your email for the confirmation link
7. Click the link → redirected to login with success message
8. Sign in with your credentials

### Local Testing - Sign In Flow

1. Go to `http://localhost:3000/login`
2. Enter email + password
3. Click "Sign in"
4. You should be redirected to `/app`

### Local Testing - Password Reset Flow

1. Go to `http://localhost:3000/login`
2. Click "Forgot password?"
3. Enter your email
4. Click "Send reset link"
5. Check your email for the reset link
6. Click the link → redirected to `/auth/reset`
7. Enter new password + confirm
8. Click "Update Password"
9. You should be redirected to `/app`

### Production Testing

Repeat the above flows on your production URL.

---

## 5. Troubleshooting

### "Email not confirmed" Error

**Cause**: User hasn't clicked the confirmation link in their email

**Fix**:
1. Check spam folder for confirmation email
2. Request a new confirmation by signing up again (will resend)
3. In dev: You can disable "Confirm email" in Supabase Dashboard temporarily

### "Invalid login credentials" Error

**Cause**: Wrong email or password

**Fix**:
1. Verify email is correct
2. Try password reset if forgotten
3. Check if account exists (try signing up)

### "User already registered" Error

**Cause**: Email already has an account

**Fix**:
1. Use the "Log in" tab instead
2. Use "Forgot password?" if password is forgotten

### Password Reset Link Not Working

**Cause**: Link expired or already used

**Fix**:
1. Request a new password reset link
2. Use the link within 24 hours
3. Check that `/auth/reset` is in Redirect URLs

### Confirmation Email Not Arriving

**Cause**: Email delivery issues

**Fix**:
1. Check spam folder
2. Verify email address is correct
3. In production: Configure custom SMTP in Supabase Dashboard > Project Settings > Auth > SMTP Settings

---

## 6. Authentication Flow Summary

### Sign Up Flow
```
User clicks "Sign up" tab
    ↓
Enters email + password + confirm password
    ↓
supabase.auth.signUp() called
    ↓
Supabase sends confirmation email
    ↓
User clicks confirmation link
    ↓
/auth/callback exchanges code, redirects to /login with success message
    ↓
User can now sign in
```

### Sign In Flow
```
User enters email + password
    ↓
supabase.auth.signInWithPassword() called
    ↓
Session created (cookies set)
    ↓
Redirect to /app
```

### Password Reset Flow
```
User clicks "Forgot password?"
    ↓
Enters email
    ↓
supabase.auth.resetPasswordForEmail() called
    ↓
Supabase sends reset email with link to /auth/reset
    ↓
User clicks link → /auth/reset page
    ↓
User enters new password
    ↓
supabase.auth.updateUser() called
    ↓
Password updated, redirect to /app
```

---

## 7. Code Architecture

### Key Files

- `src/app/login/page.tsx` - Login/Signup/Forgot password forms
- `src/app/auth/reset/page.tsx` - Password reset page
- `src/app/auth/callback/route.ts` - Handles email confirmation & recovery codes
- `src/lib/supabase/client.ts` - Browser client (cookie-based)
- `src/lib/supabase/server.ts` - Server client for RSC/API routes
- `src/lib/supabase/middleware.ts` - Session refresh middleware helper
- `src/middleware.ts` - Next.js middleware configuration

### Auth Methods Used

```typescript
// Sign up
supabase.auth.signUp({ email, password, options: { emailRedirectTo } })

// Sign in
supabase.auth.signInWithPassword({ email, password })

// Password reset request
supabase.auth.resetPasswordForEmail(email, { redirectTo })

// Set new password
supabase.auth.updateUser({ password })

// Sign out
supabase.auth.signOut()
```

---

## Support

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side)
- [Supabase Discord](https://discord.supabase.com)
