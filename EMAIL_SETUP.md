# Email Setup for Parent Confirmation

## Current Status

Right now, **parent emails are NOT being sent**. Here's what you need to know:

## Why Parents Aren't Getting Emails

When a student signs up, we save the parent email in the database (`metadata.parent_email`), but we're not actually sending any emails yet.

### What We're Storing:
```javascript
// In student signup (get-started/page.tsx)
data: {
  full_name: fullName,
  role: "student",
  parent_email: parentEmail,  // ← Saved but not emailed
  onboarding_complete: false
}
```

## Solutions for Email Sending

### Option 1: Supabase Built-in SMTP (FREE for localhost)

**Pros:**
- Free for development
- No external service needed
- Works with localhost

**Setup:**
1. Go to Supabase Dashboard → Project Settings → Auth
2. Under "SMTP Settings", enable custom SMTP
3. Use these free SMTP settings for testing:

```
SMTP Host: smtp.gmail.com (if using Gmail)
SMTP Port: 587
SMTP User: your-gmail@gmail.com
SMTP Password: your-app-specific-password
```

Or use Supabase's built-in email (limited sends per hour):
- Already configured by default
- Should work for localhost development
- Check "Auth" → "Email Templates" in Supabase Dashboard

**Limitations:**
- Gmail requires "App Password" (not your regular password)
- Limited sends per day (~500 for Gmail)

### Option 2: Resend (Recommended for Production)

**Pros:**
- 100 emails/day FREE
- Simple API
- Works with localhost
- No domain verification needed for development
- Professional email delivery

**Setup:**
1. Sign up at [resend.com](https://resend.com)
2. Get API key
3. Install: `pnpm add resend`
4. Works immediately with localhost

**Cost:**
- Free: 100 emails/day, 3,000/month
- Paid: $20/month for 50,000 emails

### Option 3: Custom Email Function (What I'll Build for You)

I can create a simple API route that sends parent confirmation emails using either:
- Resend (recommended)
- Supabase Edge Functions
- Any SMTP provider

## What I Recommend for NOW (Localhost Development)

### Quick Solution: Skip Email for Development

1. **For testing**, I can add a "Skip Parent Confirmation" button in the dashboard
2. Or automatically approve students in development mode
3. Add environment variable to disable parent confirmation:

```env
# .env.local
NEXT_PUBLIC_SKIP_PARENT_CONFIRMATION=true
```

### Best Solution: Resend Integration (15 minutes setup)

1. You sign up for Resend (free)
2. I'll build the email sending API route
3. Works instantly with localhost
4. No domain verification needed for testing

## What I'll Build Right Now

I'm going to create:

1. **Development bypass** - Skip parent confirmation when `NEXT_PUBLIC_SKIP_PARENT_CONFIRMATION=true`
2. **Email API route skeleton** - Ready for Resend or SMTP integration
3. **Resend integration guide** - Step-by-step for when you're ready

This way you can:
- Test the flow immediately without emails
- Add real emails later by just adding a Resend API key

---

## Let Me Know:

1. **Want to skip emails for now?** I'll add the development bypass
2. **Want Resend setup?** Sign up (2 mins) and give me the API key
3. **Want to use Supabase SMTP?** I'll configure it

What's your preference?
