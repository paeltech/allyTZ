# AllyTZ Panel Email Templates

This directory contains email templates for AllyTZ Panel authentication and transactional emails.

## Templates

### Signup Confirmation Email

**Files:**
- `signup-confirmation.html` - HTML version with full styling
- `signup-confirmation.txt` - Plain text fallback version

**Purpose:** Sent to users when they sign up for a AllyTZ Panel account to verify their email address.

## Design Features

The email templates use the AllyTZ Panel brand color scheme:

- **Primary Gold:** `#F4C464` - Used for accents, buttons, and highlights
- **Gold Light:** `#F5D085` - Used in gradients
- **Gold Dark:** `#D4A854` - Used in gradients
- **Background:** `#000000` (Black) - Main background
- **Card Background:** `#262625` (Nero) - Content container
- **Text Primary:** `#FFFFFF` (White) - Main text
- **Text Secondary:** `#A4A4A4` (Rainy Grey) - Secondary text
- **Text Muted:** `#777674` (Steel Wool) - Muted text and borders

**Typography:**
- Font Family: Plus Jakarta Sans (with fallbacks)
- Headings: 800 weight, -0.03em letter spacing
- Body: 500 weight, 1.75 line height

## Supabase Integration

### Setting Up Custom Email Templates in Supabase

1. **Navigate to Supabase Dashboard:**
   - Go to your Supabase project dashboard
   - Navigate to **Authentication** → **Email Templates**

2. **Configure Signup Confirmation Email:**
   - Select **Confirm signup** template
   - Copy the contents of `signup-confirmation.html` into the HTML editor
   - Copy the contents of `signup-confirmation.txt` into the Plain text editor

3. **Template Variables:**
   Supabase provides these variables that are automatically replaced:
   - `{{ .ConfirmationURL }}` - The email verification link
   - `{{ .SiteURL }}` - Your site's base URL
   - `{{ .Email }}` - User's email address
   - `{{ .Token }}` - Verification token (usually used in URL)
   - `{{ .TokenHash }}` - Hashed token
   - `{{ .RedirectTo }}` - Redirect URL after confirmation
   
   **Note:** The year in the footer is set to 2024. Update it annually or use a dynamic solution if needed.

4. **Customization:**
   - Update the logo URL if needed (currently references `/assets/logo.png`)
   - Modify colors, text, or layout as needed
   - Ensure all links point to your production domain

### Testing

1. **Local Testing:**
   - Use Supabase's email testing feature in the dashboard
   - Send a test email to verify rendering

2. **Production Testing:**
   - Create a test account
   - Verify the email renders correctly across email clients:
     - Gmail (Web, iOS, Android)
     - Outlook (Web, Desktop)
     - Apple Mail
     - Yahoo Mail

### Email Client Compatibility

The template is designed to work across major email clients:
- ✅ Gmail (Web, Mobile)
- ✅ Outlook (Web, Desktop)
- ✅ Apple Mail
- ✅ Yahoo Mail
- ✅ Thunderbird
- ✅ Mobile email clients

**Note:** Some email clients (especially Outlook) have limited CSS support. The template uses table-based layouts and inline styles for maximum compatibility.

## Customization Guide

### Changing Colors

To update colors, search and replace in the HTML file:
- `#F4C464` - Primary gold
- `#D4A854` - Dark gold
- `#F5D085` - Light gold
- `#000000` - Black background
- `#262625` - Card background (Nero)
- `#A4A4A4` - Secondary text (Rainy Grey)
- `#777674` - Borders and muted text (Steel Wool)

### Updating Logo

Replace the logo URL in the header section:
```html
<img src="{{ .SiteURL }}/assets/logo.png" alt="AllyTZ Panel Logo" ... />
```

### Modifying Content

- Update welcome message in the main content section
- Adjust CTA button text
- Modify footer information
- Add or remove sections as needed

## Best Practices

1. **Keep it Simple:** Email clients have limited CSS support
2. **Use Inline Styles:** Required for maximum compatibility
3. **Test Thoroughly:** Always test across multiple email clients
4. **Mobile First:** Ensure the template looks good on mobile devices
5. **Alt Text:** Always include alt text for images
6. **Plain Text Fallback:** Always provide a plain text version

## Support

For issues or questions about email templates:
- Contact: info@allytz.co
- Check Supabase documentation: https://supabase.com/docs/guides/auth/auth-email-templates