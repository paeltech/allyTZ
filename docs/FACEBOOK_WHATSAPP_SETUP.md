npm run dev# Facebook WhatsApp Business API Setup Guide

This guide will help you set up the Facebook WhatsApp Business API (Graph API) for sending WhatsApp notifications in AllyTZ Panel.

## Prerequisites

- Facebook Business Account
- WhatsApp Business Account
- Meta Business App
- Supabase project with Edge Functions enabled

## Step 1: Set Up Facebook WhatsApp Business API

### 1.1 Create Meta Business Account
1. Go to [Meta Business Suite](https://business.facebook.com/)
2. Create a Business Account if you don't have one
3. Verify your business information

### 1.2 Create Meta App
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click **My Apps** → **Create App**
3. Select **Business** as the app type
4. Fill in app details and create the app

### 1.3 Add WhatsApp Product
1. In your app dashboard, go to **Add Products**
2. Find **WhatsApp** and click **Set Up**
3. Follow the setup wizard

### 1.4 Get Phone Number ID
1. In your app dashboard, go to **WhatsApp** → **API Setup**
2. Find your **Phone number ID** (it's a long numeric ID)
3. Copy this ID - you'll need it for the environment variable

### 1.5 Get Access Token

**IMPORTANT**: The access token is different from the Phone Number ID. It's a long string that starts with something like `EAAB...` or `EAA...`.

#### Option 1: Temporary Token (For Testing)
1. In **WhatsApp** → **API Setup**, find **Temporary access token**
2. Click **Copy** to copy the token
3. **Note**: Temporary tokens expire after 24 hours

#### Option 2: Permanent Token (For Production)
1. Go to **Business Settings** → **Users** → **System Users**
2. Click **Add** to create a new system user
3. Give it a name (e.g., "WhatsApp API User")
4. Click **Create System User**
5. Click **Assign Assets** → Select your WhatsApp app
6. Assign permissions: `whatsapp_business_messaging`
7. Click **Generate New Token**
8. Select your app and the `whatsapp_business_messaging` permission
9. Click **Generate Token**
10. **Copy the token immediately** - you won't be able to see it again!

**Token Format**: Should look like `EAABwzLixnjYBO7ZC...` (long string, usually 200+ characters)

### 1.6 Get API Version
- The default API version is `v24.0`
- You can check available versions in the [Graph API Explorer](https://developers.facebook.com/tools/explorer/)

## Step 2: Configure Supabase

### 2.1 Set Environment Variables

Run these commands in your terminal:

```bash
supabase secrets set WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
supabase secrets set WHATSAPP_ACCESS_TOKEN=your_access_token_here
supabase secrets set WHATSAPP_API_VERSION=v24.0
```

Replace:
- `your_phone_number_id_here` with your Phone Number ID from Step 1.4
- `your_access_token_here` with your Access Token from Step 1.5
- `v24.0` with your desired API version (optional, defaults to v24.0)

### 2.2 Verify Secrets

Check that secrets are set correctly:

```bash
supabase secrets list
```

You should see:
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_API_VERSION` (optional)

### 2.3 Deploy Edge Function

Deploy the updated WhatsApp notification function:

```bash
supabase functions deploy send-whatsapp-notification
```

## Step 3: Test the Integration

### 3.1 Test with cURL

You can test the API directly using cURL:

```bash
curl 'https://graph.facebook.com/v24.0/<PHONE_NUMBER_ID>/messages' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  -d '{
    "messaging_product": "whatsapp",
    "recipient_type": "individual",
    "to": "+255721000000",
    "type": "text",
    "text": {
      "preview_url": false,
      "body": "Hello from AllyTZ Panel!"
    }
  }'
```

Replace:
- `<PHONE_NUMBER_ID>` with your Phone Number ID
- `<ACCESS_TOKEN>` with your Access Token
- `+255721000000` with a test phone number (must be registered in your WhatsApp Business account for testing)

### 3.2 Test via Admin Panel

1. Log in as an admin
2. Go to `/admin/signals`
3. Create a test signal
4. Check if WhatsApp messages are sent to subscribers
5. Check Edge Function logs in Supabase Dashboard

## Step 4: Production Setup

### 4.1 Message Templates (Required for Production)

Facebook requires message templates for production use:

1. Go to **WhatsApp** → **Message Templates**
2. Create a new template for signal notifications
3. Submit for approval (usually takes 24-48 hours)
4. Once approved, update the Edge Function to use templates

### 4.2 Webhook Setup (Recommended)

Set up webhooks to track message delivery status in real-time:

#### Step 1: Set Webhook Verify Token and App Secret

Generate secure tokens and set them as Supabase secrets:

```bash
# Generate a random verify token (or use your own secure token)
supabase secrets set WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_secure_random_token_here

# Get your App Secret from Facebook (optional but recommended for signature verification)
# Go to: Meta App Dashboard → Settings → Basic → App Secret
supabase secrets set WHATSAPP_WEBHOOK_APP_SECRET=your_app_secret_here
```

**Example verify token**: `AllyTZPanel_Webhook_2024_Secret_Key_12345`

**Note**: The App Secret is optional but recommended for production. It's used to verify webhook signatures.

#### Step 2: Deploy Webhook Function

Deploy the webhook Edge Function:

```bash
supabase functions deploy whatsapp-webhook
```

#### Step 3: Configure Webhook in Facebook

**REQUIRED**: Supabase Edge Functions require authentication at the infrastructure level. For Facebook's webhook verification (GET request) to work, we need to include the anon key in the URL. This is safe because:

- ✅ **Anon key is designed to be public** - It's used in client-side code and is protected by Row Level Security (RLS) policies
- ✅ **Only used for verification** - The GET request only verifies the token, no database access needed
- ✅ **POST requests are secure** - They use service role key from environment variables (not in URL)
- ✅ **Additional security** - Webhook signature verification adds another layer of protection

**Steps**:

1. **Get your Supabase Anon Key**:
   - Go to Supabase Dashboard → **Settings** → **API**
   - Copy the `anon` `public` key (not the service_role key)

2. **Configure Webhook in Facebook**:
   - Go to Meta App Dashboard: https://developers.facebook.com/apps/
   - Select your app → **WhatsApp** → **Configuration**
   - Scroll down to **Webhook** section → Click **Edit** or **Set up webhook**
   - Enter your webhook URL **with anon key**:
     ```
     https://YOUR_PROJECT_REF.supabase.co/functions/v1/whatsapp-webhook?apikey=YOUR_ANON_KEY
     ```
     Replace:
     - `YOUR_PROJECT_REF` with your Supabase project reference
     - `YOUR_ANON_KEY` with your Supabase anon/public key
   - Enter your **Verify Token** (the same token you set in Step 1)
   - Click **Verify and Save**

**Why Anon Key is Safe**:
- The anon key is **meant to be public** - it's already exposed in your frontend code
- It's **protected by RLS policies** - can only access data your policies allow
- **No database writes** - anon key cannot bypass RLS to write data
- **Verification only** - GET request doesn't access any database
- **POST requests secure** - Use service role key from environment (not exposed)

#### Step 4: Subscribe to Events

After verification, subscribe to the following events:
- ✅ **messages** - Incoming messages (optional, for future features)
- ✅ **message_status** - Message delivery status updates (required)

Click **Manage** next to each event and enable it.

#### Step 5: Test Webhook

1. Send a test WhatsApp message from your admin panel
2. Check the Edge Function logs in Supabase Dashboard
3. Verify that status updates are being received:
   - `sent` - Message sent to WhatsApp
   - `delivered` - Message delivered to recipient
   - `read` - Message read by recipient
   - `failed` - Message failed to send

#### Webhook URL Format

Your webhook URL should be:
```
https://iurstpwtdnlmpvwyhqfn.supabase.co/functions/v1/whatsapp-webhook
```

Replace `iurstpwtdnlmpvwyhqfn` with your actual Supabase project reference.

### 4.3 Rate Limits & Performance

Facebook WhatsApp API has rate limits:
- **Tier 1**: 1,000 conversations per 24 hours
- **Tier 2**: 10,000 conversations per 24 hours
- **Tier 3**: 100,000 conversations per 24 hours

**Performance Optimization:**
- Messages are sent in batches of 10 in parallel
- 500ms delay between batches
- Automatic rate limit handling with retries
- For 85 subscribers: ~4-5 seconds total (vs 25-50 seconds sequential)

The Edge Function includes automatic rate limit handling with retries and optimized batch processing for faster delivery.

## API Details

**Endpoint**: `https://graph.facebook.com/v24.0/{PHONE_NUMBER_ID}/messages`

**Request Format**:
```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "+255712345678",
  "type": "text",
  "text": {
    "preview_url": false,
    "body": "Your message here"
  }
}
```

**Headers**:
```
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json
```

**Response Format** (Success):
```json
{
  "messaging_product": "whatsapp",
  "contacts": [{
    "input": "+255712345678",
    "wa_id": "255712345678"
  }],
  "messages": [{
    "id": "wamid.xxx"
  }]
}
```

## Troubleshooting

### "WhatsApp API credentials not configured"
- Make sure you've set both `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_ACCESS_TOKEN`
- Verify with: `supabase secrets list`
- Redeploy the function after setting secrets

### "Invalid OAuth access token" or "Cannot parse access token"
- **Common Issue**: You may have set the access token to the same value as the Phone Number ID
- **Solution**: 
  1. Verify your secrets: `supabase secrets list`
  2. Check that `WHATSAPP_ACCESS_TOKEN` is different from `WHATSAPP_PHONE_NUMBER_ID`
  3. The access token should be a long string (200+ characters) starting with `EAAB...` or `EAA...`
  4. If you used a temporary token, it may have expired (tokens expire after 24 hours)
  5. Generate a new token from Meta Business Settings → System Users
  6. Update the secret: `supabase secrets set WHATSAPP_ACCESS_TOKEN=your_actual_token_here`
  7. Redeploy the function: `supabase functions deploy send-whatsapp-notification`

### "Invalid phone number"
- Phone numbers must be in E.164 format: `+[country code][number]`
- Example: `+255712345678` (Tanzania)
- Make sure the number is registered in your WhatsApp Business account

### "Rate limit exceeded"
- You've hit Facebook's rate limits
- The function automatically retries with exponential backoff
- Check your tier limits in Meta Business Settings

### Webhook Verification Failed - HTTP 401 Unauthorized
- **Issue**: Facebook can't verify your webhook, getting 401 error
- **Common Causes**:
  1. Verify token doesn't match (case-sensitive)
  2. Webhook URL is incorrect
  3. Function not deployed or not accessible
- **Solution**:
  1. **Ensure webhook function is deployed**: `supabase functions deploy whatsapp-webhook`
  2. **Check verify token is set**: `supabase secrets list` (should see `WHATSAPP_WEBHOOK_VERIFY_TOKEN`)
  3. **Verify token matches exactly** in Facebook (case-sensitive, no extra spaces, no quotes)
  4. **Check Edge Function logs** in Supabase Dashboard for verification attempts
  5. **Test webhook URL directly**:
     ```bash
     curl "https://YOUR_PROJECT.supabase.co/functions/v1/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test123"
     ```
     Should return `test123` if working correctly
  6. **Verify webhook URL** in Facebook matches exactly (no trailing slashes, correct project reference)
  7. **Check Supabase function logs** for any errors during verification

### Webhook Not Receiving Status Updates
- **Issue**: Messages are sent but status updates aren't received
- **Solution**:
  1. Verify webhook is subscribed to `message_status` events in Facebook
  2. Check Edge Function logs for incoming webhook events
  3. Verify `provider_message_id` matches between sent messages and webhook updates
  4. Check that the webhook function is deployed: `supabase functions deploy whatsapp-webhook`
  5. Ensure RLS policies allow service role to update notification_logs

### Message not received
- Check Edge Function logs for errors
- Verify the phone number is correct and in E.164 format
- Ensure the recipient has opted in to receive messages
- For production, make sure you're using approved message templates

### Error Code 131047
- This means the recipient's phone number is not registered on WhatsApp
- Verify the phone number is correct
- The user must have WhatsApp installed and active

## Migration from WaSender

If you were previously using WaSender API:

1. Set up Facebook WhatsApp Business API (follow steps above)
2. Set the new environment variables
3. Deploy the updated function
4. Test with a small group first
5. Monitor logs for any issues

The new implementation sends individual messages instead of group messages, which provides better delivery tracking and compliance with WhatsApp policies.

## Cost Estimation

**Facebook WhatsApp Business API Pricing** (as of 2024):
- **Conversation-based pricing**: $0.005 - $0.09 per conversation
- **24-hour conversation window**: Multiple messages to the same user within 24 hours count as one conversation
- **Free tier**: 1,000 conversations per month (for eligible businesses)

**Example**:
- 100 subscribers
- 3 signals per day
- 30 days per month
- = 100 × 3 × 30 = 9,000 conversations/month
- = $45 - $810 per month (depending on conversation type)

## Support

If you encounter issues:
1. Check Supabase Edge Function logs
2. Review Meta Business Settings for API status
3. Check `notification_logs` table for delivery status
4. Verify all environment variables are set correctly

For Facebook support: [Meta Business Help Center](https://www.facebook.com/business/help)
For Supabase support: [Supabase Support](https://supabase.com/support)
