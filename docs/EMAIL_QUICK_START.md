# 🚀 Quick Start: Email Notifications Setup

## Option 1: EmailJS (Immediate Testing - 5 minutes)

### Step 1: Create EmailJS Account

1. Go to [emailjs.com](https://emailjs.com) and sign up
2. Create a new service:
   - Click "Add New Service"
   - Choose your email provider (Gmail recommended for testing)
   - Follow the connection steps

### Step 2: Create Email Template

1. Go to "Email Templates" in EmailJS dashboard
2. Click "Create New Template"
3. Use this template ID: `template_medcure`
4. Template content:

   ```
   Subject: {{subject}}

   From: {{from_name}}
   To: {{to_name}} ({{to_email}})

   {{message}}

   ---
   HTML Content:
   {{{html_message}}}
   ```

### Step 3: Get Your Keys

1. Go to "Integration" tab in EmailJS
2. Copy your:
   - Service ID (e.g., `service_abc123`)
   - Template ID (`template_medcure`)
   - Public Key (e.g., `user_xyz789`)

### Step 4: Add to Your .env File

```env
# EmailJS Configuration (for immediate testing)
VITE_EMAILJS_SERVICE_ID=service_abc123
VITE_EMAILJS_TEMPLATE_ID=template_medcure
VITE_EMAILJS_PUBLIC_KEY=user_xyz789
VITE_EMAILJS_FROM_EMAIL=alerts@medcure.com
VITE_EMAILJS_FROM_NAME=MedCure Pharmacy Alerts
```

### Step 5: Test It!

```bash
npm run dev
```

Open browser console and run:

```javascript
window.emailService?.testConfiguration("your-email@example.com");
```

---

## Option 2: Resend (Production Ready)

### Why Resend Works with Vercel Domain:

✅ **Your app runs on Vercel** (`yourapp.vercel.app`)  
✅ **Emails are sent FROM Resend's domain** (`onboarding@resend.dev`)  
✅ **No domain setup required** - works immediately!

### Step 1: Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up with your email
3. Verify your account

### Step 2: Get API Key

1. Go to Dashboard → API Keys
2. Click "Create API Key"
3. Name: "MedCure Notifications"
4. Copy the key (starts with `re_`)

### Step 3: Simple .env Setup

```env
# Resend Configuration (production ready)
VITE_RESEND_API_KEY=re_your_api_key_here
VITE_RESEND_FROM_NAME=MedCure Pharmacy Alerts
# FROM_EMAIL will default to onboarding@resend.dev (works immediately!)
```

### Step 4: Deploy Edge Function (for production)

```bash
# Install Supabase CLI if needed
npm install supabase --save-dev

# Login to Supabase
npx supabase login

# Set secrets
npx supabase secrets set RESEND_API_KEY=re_your_api_key_here
npx supabase secrets set FROM_EMAIL=onboarding@resend.dev

# Deploy function
npx supabase functions deploy send-notification-email
```

---

## 🎯 My Recommendation Order:

### 1. **Start with EmailJS** (Today)

- Set up in 5 minutes
- Test your notifications immediately
- Perfect for development and initial testing

### 2. **Upgrade to Resend** (This Week)

- More reliable for production
- Better deliverability
- Higher email limits (3,000/month vs 200/month)

### 3. **Add Custom Domain** (Later - Optional)

- Only if you own a domain
- Not required for pharmacy notifications to work perfectly

---

## 🔥 Quick Test Commands

Once set up, test your configuration:

```javascript
// Check which provider is active
console.log(window.emailService?.getStatus());

// Send test email
window.emailService?.testConfiguration("your@email.com");

// Trigger a health check (creates notifications)
window.notificationService?.runHealthChecks();

// Check notification count
window.notificationService?.getUnreadCount("your-user-id");
```

## 📧 What Your Emails Will Look Like:

### With EmailJS:

```
From: MedCure Pharmacy Alerts <your-gmail@gmail.com>
To: admin@example.com
Subject: [MedCure] 🚨 Critical Stock Alert
```

### With Resend:

```
From: MedCure Pharmacy Alerts <onboarding@resend.dev>
To: admin@example.com
Subject: [MedCure] 🚨 Critical Stock Alert
```

Both look professional and work perfectly for pharmacy notifications!

## 🛡️ Security Notes:

- ✅ **EmailJS keys are safe in frontend** (designed for client-side use)
- ⚠️ **Resend keys should use Edge Functions** (server-side) for production
- ✅ **Your notification system already has perfect security** (deduplication, user validation, etc.)

**Ready to start? Pick EmailJS for immediate testing, then upgrade to Resend when ready!**
