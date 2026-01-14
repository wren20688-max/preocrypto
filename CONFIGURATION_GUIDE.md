# 🔧 PreoCrypto Configuration Guide

## Required Configuration (Fill These In)

### 1. Netlify Environment Variables
Go to: **Netlify Dashboard → Your Site → Site Settings → Environment Variables**

Add these 3 variables:

```
PAYHERO_ACCOUNT_ID
Value: [Your PayHero Account ID from PayHero Dashboard]
Example: 12345

PAYHERO_BASIC_AUTH
Value: Basic [Your Base64 encoded credentials]
Example: Basic YWRtaW46cGFzc3dvcmQ=
OR use PAYHERO_SECRET_KEY instead

PAYHERO_CALLBACK_URL
Value: https://www.preocrypto.com/webhook/mpesa-callback
(Already set correctly)
```

### 2. How to Get PayHero Credentials

1. **Log into PayHero Dashboard**: https://dashboard.payhero.io
2. **Go to Settings → API Keys**
3. **Copy your Account ID** → Use for `PAYHERO_ACCOUNT_ID`
4. **Copy your API Key/Secret** → Use for `PAYHERO_SECRET_KEY`
5. **Or copy Basic Auth credentials** → Use for `PAYHERO_BASIC_AUTH`

### 3. Files That DON'T Need Editing (Already Configured)

These files automatically use environment variables:
- ✅ netlify/functions/stk-push.js
- ✅ netlify/functions/create-payment.js
- ✅ netlify/functions/test-config.js
- ✅ server.js
- ✅ payhero-integration.js
- ✅ simple_server.py

All callback URLs are set to: `https://www.preocrypto.com/webhook/mpesa-callback`

### 4. Database Configuration (Supabase)

If using Supabase, add these to Netlify environment variables:

```
SUPABASE_URL
Value: https://your-project.supabase.co

SUPABASE_KEY
Value: your-anon-public-key

SUPABASE_SERVICE_KEY
Value: your-service-role-key (for admin functions)
```

Get these from: Supabase Dashboard → Project Settings → API

### 5. Quick Setup Checklist

- [ ] Sign up for PayHero account at https://payhero.io
- [ ] Get Account ID and API credentials from PayHero dashboard
- [ ] Add 3 PayHero variables to Netlify (see #1 above)
- [ ] Redeploy your site on Netlify
- [ ] Test payments on deployed URL: https://your-site.netlify.app/payment-methods.html

### 6. Testing

After adding environment variables and redeploying:

1. Open: https://your-site.netlify.app/test-env-direct.html
2. Click "Test STK Push Direct"
3. Check if you see logs showing your Account ID
4. If you see "config_error", the variables aren't set correctly

### 7. Common Issues

**Issue**: "Missing PayHero credentials"
**Fix**: Make sure `PAYHERO_BASIC_AUTH` or `PAYHERO_SECRET_KEY` is set in Netlify

**Issue**: "Missing PAYHERO_ACCOUNT_ID"  
**Fix**: Add your Account ID to Netlify environment variables

**Issue**: Still getting 500 errors
**Fix**: After adding variables, you MUST redeploy the site for them to take effect

### 8. No Code Changes Needed!

✅ All code is already configured to read from environment variables
✅ No hardcoded credentials in code (security best practice)
✅ Just add the 3 variables to Netlify and redeploy

---

## Summary: What You Need To Do

1. Get credentials from PayHero Dashboard
2. Add 3 environment variables to Netlify
3. Redeploy your site
4. Test payments

That's it! No code editing required.
