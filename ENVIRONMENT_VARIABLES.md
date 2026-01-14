# Environment Variables Setup

## Required Environment Variables for Netlify

To fix the 500 errors you're seeing, you need to configure these environment variables in your Netlify dashboard:

### PayHero API Credentials

1. **PAYHERO_BASIC_AUTH** (Required)
   - Your PayHero Basic Authentication token
   - Format: `Basic <base64_encoded_credentials>`
   - Get this from PayHero Dashboard → Settings → API Keys

2. **PAYHERO_SECRET_KEY** (Alternative to BASIC_AUTH)
   - Your PayHero Secret Key
   - Format: `sk_live_xxxxx` or `sk_test_xxxxx`
   - Get this from PayHero Dashboard → Settings → API Keys

3. **PAYHERO_ACCOUNT_ID** (Required)
   - Your PayHero account ID
   - Format: Numeric value (e.g., `4575`)
   - Get this from PayHero Dashboard URL or Settings

4. **PAYHERO_CALLBACK_URL** (Required)
   - Your webhook callback URL
   - Format: `https://your-site.netlify.app/webhook/mpesa-callback`
   - Replace `your-site` with your actual Netlify site name

## How to Set Environment Variables in Netlify

### Option 1: Via Netlify Dashboard (Recommended)

1. Go to your Netlify dashboard
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Click **Add a variable**
5. Add each variable:
   ```
   Key: PAYHERO_BASIC_AUTH
   Value: Basic <your_token_here>
   Scopes: All
   ```
6. Repeat for all required variables
7. Click **Save**
8. **Redeploy your site** (Important!)

### Option 2: Via Netlify CLI

```bash
# Install Netlify CLI if you haven't
npm install -g netlify-cli

# Login to Netlify
netlify login

# Set environment variables
netlify env:set PAYHERO_BASIC_AUTH "Basic <your_token>"
netlify env:set PAYHERO_ACCOUNT_ID "4575"
netlify env:set PAYHERO_CALLBACK_URL "https://your-site.netlify.app/webhook/mpesa-callback"

# Redeploy
netlify deploy --prod
```

## Checking Current Environment Variables

In Netlify Dashboard:
1. Go to **Site settings** → **Environment variables**
2. Verify all required variables are present
3. Check that values don't have extra spaces or quotes

## Common Issues

### 500 Error on `/api/payment/intent`
**Cause:** Missing `PAYHERO_BASIC_AUTH` or `PAYHERO_SECRET_KEY`
**Fix:** Add the missing credential to environment variables

### 500 Error with "Payment gateway not configured"
**Cause:** Missing `PAYHERO_ACCOUNT_ID`
**Fix:** Add your PayHero account ID

### STK Push not appearing on phone
**Cause:** Incorrect phone number format or PayHero configuration
**Fix:** 
- Verify phone number format: +254XXXXXXXXX
- Check PayHero account is active and has sufficient balance
- Verify webhook URL is correct

## Testing After Setup

1. Set all environment variables
2. Redeploy your Netlify site
3. Go to Payment Methods page
4. Try making a small test deposit ($10)
5. Check browser console for any errors
6. If still failing, check Netlify function logs for detailed error messages

## Getting PayHero Credentials

1. Sign up at [PayHero](https://payhero.co.ke/)
2. Complete KYC verification
3. Go to Settings → API Keys
4. Copy your credentials:
   - Account ID
   - Secret Key or Basic Auth token
5. Set up webhook URL in PayHero dashboard

## Support

If you continue to experience issues:
1. Check Netlify function logs for specific error messages
2. Verify PayHero dashboard shows no account issues
3. Test with PayHero's test credentials first
4. Contact PayHero support if credentials are not working
