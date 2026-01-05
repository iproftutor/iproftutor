# Quick Start: Email Setup for Parent Confirmation

## For Local Development (Right Now)

### 1. Add this to your `.env.local`:

```env
NEXT_PUBLIC_SKIP_PARENT_CONFIRMATION=true
```

**What this does:**
- Students can access the dashboard immediately
- No parent email required
- Perfect for testing the app locally

### 2. Restart your dev server:

```bash
pnpm dev
```

**That's it!** You can now:
- Sign up as a student
- Skip the parent confirmation waiting page
- Access the dashboard immediately

---

## When You Want Real Emails (Production)

### Option A: Resend (Recommended - 5 minutes)

**1. Sign up for Resend** (free, no credit card):
   - Go to [resend.com](https://resend.com)
   - Sign up with email
   - Get your API key

**2. Install Resend:**
```bash
pnpm add resend
```

**3. Add to `.env.local`:**
```env
RESEND_API_KEY=re_your_api_key_here
NEXT_PUBLIC_SKIP_PARENT_CONFIRMATION=false
```

**4. Uncomment the email code:**
   - Open `app/api/send-parent-confirmation/route.ts`
   - Uncomment the Resend code (marked with `TODO`)

**5. Call the API when student signs up:**
   - I'll add this call to the student onboarding completion

**That's it!** Parents will get emails instantly.

**Limitations:**
- Free tier: 100 emails/day, 3,000/month
- Default sender: `onboarding@resend.dev` (works for testing)
- For custom domain: Add DNS records (optional)

---

## Option B: Supabase Built-in Email (Already Available)

Supabase has built-in email for auth, but for custom emails like parent confirmation:

**1. In Supabase Dashboard:**
   - Go to Project Settings → Auth → SMTP Settings
   - Enable custom SMTP
   - Add Gmail or other SMTP credentials

**2. Use Supabase Edge Functions:**
   - Create an Edge Function to send emails
   - More complex than Resend
   - Not recommended unless you need it

---

## What I Did

### ✅ Created Files:
1. `EMAIL_SETUP.md` - Full email guide
2. `.env.local.example` - Environment template
3. `app/api/send-parent-confirmation/route.ts` - Email API (ready for Resend)

### ✅ Updated Files:
1. `app/auth/get-started/page.tsx`:
   - Removed "I am a" label (cleaner UI)
   - Made inputs fully rounded with better padding (h-11, px-4)
   - Reduced spacing between fields (space-y-1.5)
   - Cleaner parent email description

2. `app/student/dashboard/page.tsx`:
   - Added development bypass for parent confirmation
   - Checks `NEXT_PUBLIC_SKIP_PARENT_CONFIRMATION` env variable

### 📋 Current State:
- **Parent emails are NOT being sent** (just stored in database)
- **Development mode available** - Skip parent confirmation for testing
- **Email API ready** - Just needs Resend API key to work

---

## Next Steps

**For testing locally now:**
```bash
# Add to .env.local
echo "NEXT_PUBLIC_SKIP_PARENT_CONFIRMATION=true" >> .env.local

# Restart dev server
pnpm dev
```

**For production emails later:**
1. Sign up for Resend (free)
2. Add `RESEND_API_KEY` to `.env.local`
3. Set `NEXT_PUBLIC_SKIP_PARENT_CONFIRMATION=false`
4. Uncomment email code in `app/api/send-parent-confirmation/route.ts`

---

## Questions?

Let me know if you want me to:
- Integrate Resend fully (just give me the API key)
- Add the email sending call to student onboarding
- Create email templates for parent confirmation
