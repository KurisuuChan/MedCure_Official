# 📧 Email Notification Setup Guide

## Overview

This guide will help you set up email notifications for your MedCure pharmacy system. You have several free options, but **Resend with Supabase Edge Functions** is the recommended approach.

## 🏆 Recommended: Resend + Supabase Edge Functions

### Why This Approach?

- ✅ **Free**: 3,000 emails/month with Resend free tier
- ✅ **Secure**: API keys stored server-side, not in frontend
- ✅ **No CORS issues**: Runs server-side via Supabase
- ✅ **Easy to maintain**: Integrates with your existing Supabase setup

### Step 1: Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up for free account
3. Verify your email
4. Create your first API key:
   - Go to Dashboard → API Keys
   - Click "Create API Key"
   - Name it "MedCure Notifications"
   - Copy the key (you won't see it again!)

### Step 2: Deploy Supabase Edge Function

1. **Install Supabase CLI** (if not already installed):

   ```bash
   npm install supabase --save-dev
   ```

2. **Login to Supabase**:

   ```bash
   npx supabase login
   ```

3. **Deploy the edge function**:

   ```bash
   npx supabase functions deploy send-notification-email --project-ref YOUR_PROJECT_REF
   ```

4. **Set environment variables in Supabase**:

   ```bash
   npx supabase secrets set RESEND_API_KEY=your_resend_api_key_here
   npx supabase secrets set FROM_EMAIL=alerts@yourdomain.com
   ```

   Or via Supabase Dashboard:

   - Go to Project Settings → Edge Functions
   - Add secrets:
     - `RESEND_API_KEY`: Your Resend API key
     - `FROM_EMAIL`: Your "from" email address

### Step 3: Update Your Environment Variables

Add to your `.env` file:

```env
# Email Configuration (for fallback and display purposes)
VITE_RESEND_API_KEY=your_resend_api_key_here
VITE_RESEND_FROM_EMAIL=alerts@yourdomain.com
VITE_RESEND_FROM_NAME=MedCure Pharmacy
```

### Step 4: Test Email Configuration

1. Open your MedCure app
2. Open browser console
3. Run test:
   ```javascript
   // Test the email service
   window.emailService?.testConfiguration("your-email@example.com");
   ```

### Step 5: Verify Notifications Work

1. Create a test low stock scenario:
   - Go to Inventory
   - Set a product's stock below its reorder level
   - Wait for the health check (runs every 15 minutes)
   - Or manually trigger: `window.notificationService.runHealthChecks()`

## 🔧 Alternative: Direct SendGrid Setup

If you prefer SendGrid instead:

### Setup Steps:

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create API key in dashboard
3. Add to `.env`:
   ```env
   VITE_SENDGRID_API_KEY=your_sendgrid_api_key_here
   VITE_SENDGRID_FROM_EMAIL=alerts@yourdomain.com
   VITE_SENDGRID_FROM_NAME=MedCure Pharmacy
   ```
4. **Note**: You'll need to create a similar Edge Function for SendGrid to avoid CORS issues

## 📧 Email Domain Setup (Optional but Recommended)

For better deliverability, set up a custom domain:

### With Resend:

1. Go to Resend Dashboard → Domains
2. Add your domain (e.g., yourdomain.com)
3. Add the DNS records shown
4. Use emails like: `alerts@yourdomain.com`

### Benefits:

- Better deliverability rates
- Professional appearance
- Less likely to end up in spam

## 🚨 Important Notes

1. **Free Tier Limits**:

   - Resend: 3,000 emails/month, 100/day
   - SendGrid: 100 emails/day
   - These are usually sufficient for pharmacy notifications

2. **Email Frequency**:

   - Health checks run every 15 minutes
   - Duplicate notifications are prevented for 24 hours
   - Only critical alerts (out of stock, very low stock, expiring soon) send emails

3. **Security**:
   - Never put API keys in frontend environment variables in production
   - Use Supabase Edge Functions to keep API keys secure
   - The current setup is development-friendly but production-ready

## 📊 Monitoring Email Delivery

### Resend Dashboard:

- View sent emails
- Track delivery status
- Monitor bounce rates
- View error logs

### In Your App:

Check notification status:

```javascript
// View email service status
console.log(window.emailService?.getStatus());

// View recent notifications
window.notificationService?.getUserNotifications("your-user-id");
```

## 🔍 Troubleshooting

### Common Issues:

1. **CORS Errors**: Expected if calling APIs directly from browser

   - Solution: Use Supabase Edge Functions

2. **API Key Not Working**:

   - Check if key is correctly set in Supabase secrets
   - Verify key permissions in email provider dashboard

3. **Emails Not Sending**:

   - Check browser console for errors
   - Verify Edge Function is deployed correctly
   - Test with `window.emailService.testConfiguration()`

4. **Emails in Spam**:
   - Set up domain authentication
   - Use professional "from" email address
   - Avoid spam trigger words in subject lines

### Debug Commands:

```javascript
// Check email service configuration
window.emailService?.getStatus();

// Test email sending
window.emailService?.testConfiguration("your@email.com");

// Manually trigger health checks
window.notificationService?.runHealthChecks();

// Check last health check time
window.checkHealthStatus?.();
```

## 💡 Pro Tips

1. **Start with Resend**: It's more developer-friendly than SendGrid
2. **Monitor Usage**: Keep an eye on your monthly email quota
3. **Test Thoroughly**: Always test in development before production
4. **Set Up Domain**: Improves deliverability significantly
5. **Custom Templates**: The system already has beautiful HTML email templates
6. **Backup Plan**: Consider setting up both Resend and SendGrid for redundancy

## 🚀 Production Deployment

For production:

1. Use environment-specific API keys
2. Set up proper domain with DNS records
3. Monitor email delivery rates
4. Set up alerting if email service fails
5. Consider upgrading to paid plans for higher limits

Your notification system is already production-ready - you just need to add the email backend!
