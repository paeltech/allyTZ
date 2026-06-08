# Supabase Email Configuration Guide

This guide helps you configure email sending in Supabase for SavannaFX signup confirmation emails.

## Common Issues

### 1. Email Not Sending

**Symptoms:**
- Signup succeeds but no confirmation email is received
- Error message about email sending failure

**Solutions:**

#### A. Check Supabase Email Settings

1. Go to **Supabase Dashboard** → **Authentication** → **Settings**
2. Under **Email Auth**, ensure:
   - ✅ **Enable email confirmations** is turned ON
   - ✅ **Enable email signup** is turned ON
   - ✅ **Secure email change** is configured (optional)

#### B. Configure Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Add your site URLs to **Redirect URLs**:
   - `http://localhost:5173/**` (for local development)
   - `https://savannafx.co/**` (for production)
   - `https://*.savannafx.co/**` (if using subdomains)
   - **Mobile app (forgot password):** `savannafx://auth/reset-password` (so password reset emails open the app)

#### C. Check SMTP Configuration

**Option 1: Use Supabase Default SMTP (Limited)**
- Supabase provides default SMTP with rate limits
- Good for development and testing
- May have delivery issues in production

**Option 2: Configure Custom SMTP (Recommended for Production)**

1. Go to **Project Settings** → **Auth** → **SMTP Settings**
2. Configure your SMTP provider:
   - **Host:** Your SMTP server (e.g., `smtp.gmail.com`, `smtp.sendgrid.net`)
   - **Port:** Usually `587` (TLS) or `465` (SSL)
   - **Username:** Your SMTP username
   - **Password:** Your SMTP password
   - **Sender email:** The email address that will send emails
   - **Sender name:** "SavannaFX" (or your preferred name)

**Popular SMTP Providers:**
- **SendGrid** (Recommended)
- **Mailgun**
- **Amazon SES**
- **Postmark**
- **Resend**

### 2. Email Template Configuration

1. Go to **Authentication** → **Email Templates**
2. Select **Confirm signup** template
3. Copy the HTML from `supabase/email-templates/signup-confirmation.html`
4. Copy the plain text from `supabase/email-templates/signup-confirmation.txt`
5. Click **Save**

**Important:** Make sure the template uses the correct variables:
- `{{ .ConfirmationURL }}` - Verification link
- `{{ .SiteURL }}` - Your site URL
- `{{ .Email }}` - User's email

### 3. Email Rate Limiting

Supabase has rate limits on email sending:
- **Free tier:** Limited emails per hour
- **Pro tier:** Higher limits

**If you hit rate limits:**
- Wait a few minutes and try again
- Consider upgrading your Supabase plan
- Use a custom SMTP provider with higher limits

### 4. Email Going to Spam

**Check:**
1. SPF records are configured for your domain
2. DKIM is set up (if using custom SMTP)
3. Email content doesn't trigger spam filters
4. Sender reputation is good

**For custom SMTP:**
- Verify your domain with your SMTP provider
- Set up SPF and DKIM records
- Use a dedicated IP if possible

## Testing Email Configuration

### Test in Development

1. Sign up with a test email address
2. Check your email inbox (and spam folder)
3. Verify the email template renders correctly
4. Click the confirmation link to test the redirect

### Test Email Sending

1. Go to **Authentication** → **Email Templates**
2. Click **Send test email**
3. Enter a test email address
4. Check if the email is received

## Troubleshooting Steps

1. **Check Supabase Logs:**
   - Go to **Logs** → **Auth Logs**
   - Look for email-related errors

2. **Verify Email Settings:**
   ```sql
   -- Check if email confirmations are enabled
   -- This is done via Dashboard, not SQL
   ```

3. **Test SMTP Connection:**
   - If using custom SMTP, test the connection in Supabase dashboard
   - Verify credentials are correct

4. **Check Redirect URLs:**
   - Ensure your site URL is in the allowed redirect URLs list
   - Format: `https://yourdomain.com/**`

5. **Review Error Messages:**
   - Check browser console for detailed error messages
   - Check Supabase dashboard logs

## Production Checklist

Before going to production:

- [ ] Custom SMTP configured (not using default)
- [ ] Email templates configured in Supabase
- [ ] Redirect URLs added for production domain
- [ ] Email confirmations enabled
- [ ] Test email sent and received successfully
- [ ] SPF/DKIM records configured (if using custom domain)
- [ ] Email template tested across email clients
- [ ] Error handling tested for email failures

## Support

If you continue to have issues:

1. Check Supabase status page: https://status.supabase.com
2. Review Supabase documentation: https://supabase.com/docs/guides/auth/auth-email-templates
3. Contact Supabase support
4. Contact SavannaFX support: info@savannafx.co

## Code Configuration

The signup form is configured with:
- `emailRedirectTo`: Set to redirect to `/dashboard` after confirmation
- Error handling for email-specific errors
- Detailed logging for debugging

See `src/components/SignupForm.tsx` for implementation details.