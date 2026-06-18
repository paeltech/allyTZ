# WhatsApp Broadcast Setup Guide

This guide will help you set up the WhatsApp broadcast system for AllyTZ Panel.

## Prerequisites

- Twilio account
- Supabase project
- Admin access to your Supabase dashboard

## Step 1: Set Up Twilio WhatsApp

### 1.1 Create Twilio Account
1. Go to [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Sign up for a free account
3. Verify your email and phone number

### 1.2 Enable WhatsApp Sandbox (For Testing)
1. In Twilio Console, go to **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Follow the instructions to join the WhatsApp Sandbox
3. Send the code to the Twilio WhatsApp number to activate
4. Note down your **Sandbox WhatsApp Number** (e.g., `+14155238886`)

### 1.3 Get Twilio Credentials
1. Go to Twilio Console Dashboard
2. Find your **Account SID** and **Auth Token**
3. Keep these secure - you'll need them for Supabase

### 1.4 Production Setup (After Testing)
For production use, you'll need to:
1. Apply for WhatsApp Business API access through Twilio
2. Get your WhatsApp Business number approved
3. Submit message templates for approval

## Step 2: Configure Supabase

### 2.1 Run Database Migrations
Run the following migrations in order in your Supabase SQL Editor:

```bash
# 1. Create user profiles table
supabase/migrations/create_user_profiles.sql

# 2. Create signals table
supabase/migrations/create_signals_table.sql

# 3. Update signal subscriptions
supabase/migrations/update_signal_subscriptions_notifications.sql

# 4. Create notification logs
supabase/migrations/create_notification_logs.sql

# 5. Create broadcast trigger
supabase/migrations/create_signal_broadcast_trigger.sql
```

### 2.2 Enable pg_net Extension
1. Go to Supabase Dashboard → **Database** → **Extensions**
2. Search for `pg_net`
3. Enable the extension

### 2.3 Set Configuration Parameters
Run these SQL commands in your Supabase SQL Editor:

```sql
-- Set Edge Function URL (replace with your project URL)
ALTER DATABASE postgres SET app.settings.edge_function_url = 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-whatsapp-notification';

-- Set Service Role Key (get from Supabase Settings → API)
ALTER DATABASE postgres SET app.settings.service_role_key = 'YOUR_SERVICE_ROLE_KEY';
```

### 2.4 Deploy Edge Function
1. Install Supabase CLI if you haven't:
   ```bash
   npm install -g supabase
   ```

2. Link your project:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

3. Deploy the Edge Function:
   ```bash
   supabase functions deploy send-whatsapp-notification
   ```

4. Set Twilio secrets:
   ```bash
   supabase secrets set TWILIO_ACCOUNT_SID=your_account_sid
   supabase secrets set TWILIO_AUTH_TOKEN=your_auth_token
   supabase secrets set TWILIO_WHATSAPP_NUMBER=+14155238886
   ```

## Step 3: Test the System

### 3.1 Create Test User with Phone Number
1. Sign up a new user on your platform
2. Use your own WhatsApp number for testing
3. Make sure to include the country code (e.g., `+255123456789`)

### 3.2 Create Test Subscription
Run this SQL in Supabase:

```sql
-- Get your user ID first
SELECT id FROM auth.users WHERE email = 'your-test-email@example.com';

-- Get a pricing ID
SELECT id FROM signal_pricing WHERE pricing_type = 'monthly';

-- Create a test subscription
INSERT INTO signal_subscriptions (
  user_id,
  pricing_id,
  subscription_type,
  status,
  payment_status,
  amount_paid,
  whatsapp_notifications
) VALUES (
  'YOUR_USER_ID',
  'YOUR_PRICING_ID',
  'monthly',
  'active',
  'completed',
  50.00,
  true
);
```

### 3.3 Create Test Signal
1. Log in as an admin
2. Go to `/admin/signals`
3. Click "Create Signal"
4. Fill in the signal details
5. Submit the form

### 3.4 Verify WhatsApp Message
1. Check your WhatsApp
2. You should receive a message from the Twilio Sandbox number
3. Check the `notification_logs` table to see the delivery status

## Step 4: Monitor and Debug

### Check Notification Logs
```sql
SELECT * FROM notification_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check Edge Function Logs
1. Go to Supabase Dashboard → **Edge Functions**
2. Click on `send-whatsapp-notification`
3. View the logs tab

### Common Issues

**Issue: No WhatsApp message received**
- Check if user has verified phone number
- Verify subscription is active
- Check notification_logs for error messages
- Ensure Twilio credentials are correct

**Issue: Edge Function not triggering**
- Verify pg_net extension is enabled
- Check configuration parameters are set
- Review database trigger logs

**Issue: Invalid phone number format**
- Phone numbers must include country code
- Format: `+[country code][number]` (e.g., `+255712345678`)
- No spaces or special characters except `+`

## Step 5: Production Deployment

### 5.1 Get WhatsApp Business API Approved
1. Apply through Twilio for WhatsApp Business API
2. Provide business documentation
3. Wait for approval (usually 1-2 weeks)

### 5.2 Create Message Templates
1. Go to Twilio Console → WhatsApp → Message Templates
2. Create a template for signal notifications
3. Submit for approval
4. Update Edge Function to use approved template

### 5.3 Update Edge Function for Production
Replace the message formatting in the Edge Function to use approved templates:

```typescript
// Use Twilio Content API with approved template
const response = await fetch(
  `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
  {
    method: "POST",
    headers: {
      "Authorization": `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      From: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
      To: `whatsapp:${phoneNumber}`,
      ContentSid: "YOUR_APPROVED_TEMPLATE_SID",
      ContentVariables: JSON.stringify({
        "1": signal.trading_pair,
        "2": signal.entry_price,
        // ... map other variables
      }),
    }),
  }
);
```

## Cost Estimation

**Twilio WhatsApp Pricing** (as of 2024):
- Sandbox: Free for testing
- Production: ~$0.005 - $0.01 per message
- Monthly costs depend on:
  - Number of subscribers
  - Number of signals sent per day

**Example**:
- 100 subscribers
- 3 signals per day
- 30 days per month
= 100 × 3 × 30 = 9,000 messages/month
= $45 - $90 per month

## Support

If you encounter issues:
1. Check Supabase Edge Function logs
2. Review Twilio console for delivery status
3. Check `notification_logs` table for errors
4. Verify all environment variables are set correctly

For Twilio support: [https://support.twilio.com](https://support.twilio.com)
For Supabase support: [https://supabase.com/support](https://supabase.com/support)
