# Supabase Authentication Setup

## ✅ Completed Setup

### 1. **Installed Dependencies**

- `@supabase/supabase-js` v2.81.1
- `@supabase/ssr` v0.7.0

### 2. **Created Supabase Client Files**

- `lib/supabase/client.ts` - Browser client
- `lib/supabase/server.ts` - Server client
- `lib/supabase/middleware.ts` - Session refresh middleware

### 3. **Updated Environment Variables**

Updated `.env.local` with proper `NEXT_PUBLIC_` prefixes:

```env
NEXT_PUBLIC_SUPABASE_URL=https://lfxraubppdryvqoowvux.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. **Created Auth Callback Route**

- `app/auth/callback/route.ts` - Handles OAuth redirects

### 5. **Added Middleware**

- `middleware.ts` - Protects authenticated routes and refreshes sessions

### 6. **Integrated Authentication**

- **Sign In Page**: Google OAuth + Email/Password
- **Get Started Page**: Google OAuth + Email/Password signup
- Both pages include:
  - Loading states
  - Error handling
  - User type selection (Student/Teacher/Parent)
  - Dashboard redirection based on user type

---

## 🔧 What You Need to Do in Supabase Dashboard

### 1. **Configure Google OAuth Provider**

1. Go to: **Authentication** → **Providers** → **Google**
2. Enable Google provider
3. Add your OAuth credentials:
   - Client ID (from Google Cloud Console)
   - Client Secret (from Google Cloud Console)

### 2. **Set Redirect URLs**

Add these URLs in Supabase under **Authentication** → **URL Configuration**:

**Development:**

```
http://localhost:3000/auth/callback
```

**Production (when deployed):**

```
https://yourdomain.com/auth/callback
```

### 3. **Configure Site URL**

Set your site URL in **Authentication** → **URL Configuration**:

- Development: `http://localhost:3000`
- Production: `https://yourdomain.com`

---

## 🚀 How to Test

### 1. **Restart Dev Server**

```bash
pnpm dev
```

### 2. **Test Google OAuth Flow**

1. Navigate to `/auth/sign-in`
2. Select user type (Student/Teacher/Parent)
3. Click "Continue with Google"
4. Complete Google sign-in
5. Should redirect to appropriate dashboard

### 3. **Test Email/Password Flow**

1. Navigate to `/auth/get-started`
2. Fill in the form
3. Click "Create account"
4. Should redirect to dashboard

---

## 📋 Protected Routes

These routes now require authentication (handled by middleware):

- `/student/*`
- `/teachers/*`
- `/parents/*`
- `/admin/*`

Unauthenticated users will be redirected to `/auth/sign-in`

---

## 🔐 User Metadata Structure

User metadata stored in Supabase:

```typescript
{
  full_name: string,
  user_type: "student" | "teacher" | "parent",
  parent_email: string | null  // Only for students
}
```

---

## 🐛 Common Issues & Solutions

### Issue: "Invalid redirect URL"

**Solution:** Ensure callback URL is added in Supabase dashboard

### Issue: "Google OAuth not configured"

**Solution:** Enable Google provider and add credentials in Supabase

### Issue: "Session not persisting"

**Solution:** Check middleware is running and cookies are being set

---

## 📝 Next Steps

1. **Create user profiles table** in Supabase to store additional user data
2. **Set up Row Level Security (RLS)** policies
3. **Add email verification** flow
4. **Implement password reset** functionality
5. **Add role-based access control** (RBAC)
6. **Store user_type in database** for dashboard routing logic

---

## 💳 Subscriptions Table Setup

Run this SQL in Supabase SQL Editor to create the subscriptions table:

```sql
-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'basic_voice', 'premium')),
  billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);

-- Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own subscription
CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Service role can do everything (for webhooks)
CREATE POLICY "Service role full access" ON subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- Function to automatically create free subscription for new users
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create subscription when profile is created
CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_default_subscription();
```
