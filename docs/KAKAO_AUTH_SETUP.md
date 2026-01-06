# Kakao OAuth Setup Guide

This document provides a complete checklist for setting up Kakao authentication with Supabase.

## Prerequisites

- Supabase project at `https://rfksuutokcwjsijkpcua.supabase.co`
- Kakao Developers account at [https://developers.kakao.com](https://developers.kakao.com)
- Vercel deployment (or localhost for development)

---

## 1. Kakao Developers Console Setup

### 1.1 Create a Kakao Application

1. Go to [Kakao Developers Console](https://developers.kakao.com/console/app)
2. Click "Create Application" (애플리케이션 추가하기)
3. Fill in:
   - App Name (앱 이름): `Praise Journal` or your preferred name
   - Company (사업자명): Your name/company

### 1.2 Get App Keys

1. Navigate to your app's **App Keys** (앱 키) section
2. Copy the **REST API Key** (REST API 키)
   - This is your Kakao Client ID for Supabase

### 1.3 Configure Redirect URI

1. Go to **Kakao Login** (카카오 로그인) in the left menu
2. Enable Kakao Login (활성화 설정: ON)
3. Go to **Redirect URI** section
4. Add the following URI:

```
https://rfksuutokcwjsijkpcua.supabase.co/auth/v1/callback
```

> **CRITICAL**: This must match exactly. Supabase handles the OAuth callback, NOT your app directly.

### 1.4 Configure Consent Items (Optional)

1. Go to **Consent Items** (동의 항목)
2. Enable at minimum:
   - Profile Info (닉네임) - Required for user display name
   - Email (카카오계정(이메일)) - Required for user identification

---

## 2. Supabase Dashboard Setup

### 2.1 Enable Kakao Provider

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `rfksuutokcwjsijkpcua`
3. Navigate to **Authentication** → **Providers**
4. Find **Kakao** and toggle it **ON**
5. Enter:
   - **Kakao Client ID**: Your REST API Key from Kakao Developers
   - **Kakao Client Secret**: Leave empty (not required for Kakao)

### 2.2 Configure URL Settings

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**:
   - For production: `https://your-vercel-domain.vercel.app`
   - For development: `http://localhost:3000`
3. Add **Redirect URLs** (one per line):

```
http://localhost:3000/auth/callback
http://localhost:3000/app
https://your-vercel-domain.vercel.app/auth/callback
https://your-vercel-domain.vercel.app/app
```

> **Note**: Replace `your-vercel-domain` with your actual Vercel deployment URL.

---

## 3. Environment Variables

### 3.1 Local Development (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=https://rfksuutokcwjsijkpcua.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3.2 Vercel Environment Variables

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://rfksuutokcwjsijkpcua.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your Supabase anon key

---

## 4. Verification Checklist

### Kakao Developers Console
- [ ] Application created
- [ ] REST API Key copied
- [ ] Kakao Login enabled (활성화: ON)
- [ ] Redirect URI set to: `https://rfksuutokcwjsijkpcua.supabase.co/auth/v1/callback`
- [ ] Required consent items enabled (Profile, Email)

### Supabase Dashboard
- [ ] Kakao provider enabled
- [ ] Kakao Client ID (REST API Key) entered
- [ ] Site URL configured
- [ ] Redirect URLs include:
  - [ ] `http://localhost:3000/auth/callback`
  - [ ] `https://your-vercel-domain.vercel.app/auth/callback`
  - [ ] `http://localhost:3000/app`
  - [ ] `https://your-vercel-domain.vercel.app/app`

### Environment Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL` set correctly
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set correctly

---

## 5. Testing

### Local Testing

1. Run `npm run dev`
2. Go to `http://localhost:3000/login`
3. Click "Continue with Kakao"
4. You should be redirected to Kakao's login page
5. After login, you should be redirected back to `/app`

### Production Testing

1. Deploy to Vercel
2. Go to `https://your-vercel-domain.vercel.app/login`
3. Click "Continue with Kakao"
4. Complete the Kakao login flow
5. Verify you're redirected to `/app` with a valid session

---

## 6. Troubleshooting

### "unsupported provider" Error

**Cause**: Kakao is not enabled in Supabase Dashboard

**Fix**:
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Kakao provider
3. Enter your Kakao REST API Key

### "Invalid redirect_uri" Error from Kakao

**Cause**: Redirect URI mismatch

**Fix**:
1. In Kakao Developers Console, verify the Redirect URI is exactly:
   ```
   https://rfksuotokcwjsijkpcua.supabase.co/auth/v1/callback
   ```
2. Check for typos (especially in the Supabase project ID)

### User redirected but no session

**Cause**: Redirect URL not in Supabase allowed list

**Fix**:
1. Add your app's callback URL to Supabase Dashboard → Authentication → URL Configuration → Redirect URLs

### Debug Mode

In development, click "Show Debug Info" on the login page to see:
- Supabase JS version
- Supabase URL configured
- Last auth attempt details
- Error messages

---

## 7. OAuth Flow Summary

```
User clicks "Continue with Kakao"
    ↓
App calls supabase.auth.signInWithOAuth({ provider: 'kakao' })
    ↓
Supabase redirects to: https://kauth.kakao.com/oauth/authorize?...
    ↓
User logs in with Kakao
    ↓
Kakao redirects to: https://rfksuutokcwjsijkpcua.supabase.co/auth/v1/callback
    ↓
Supabase exchanges code for tokens
    ↓
Supabase redirects to: http://localhost:3000/auth/callback (your app)
    ↓
App's /auth/callback route exchanges code for session
    ↓
User is redirected to /app with valid session
```

---

## Support

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Kakao Developers Documentation](https://developers.kakao.com/docs/latest/ko/kakaologin/common)
- [Supabase Discord](https://discord.supabase.com)
