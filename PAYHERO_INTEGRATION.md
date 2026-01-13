# 💳 PayHero Integration Guide

## What's Configured ✅

Your PreoCrypto platform has **complete PayHero integration** ready:

### PayHero Netlify Functions
- ✅ `payhero-create-intent.js` - Create payment intent
- ✅ `payhero-create-payment.js` - Process payment
- ✅ `stk-push.js` - M-Pesa STK push (via PayHero)
- ✅ `webhook-payhero.js` - Handle PayHero webhooks
- ✅ `test-config.js` - Test PayHero configuration

### Payment Flow
1. User enters amount on **Wallet & Funds** page
2. Clicks "Deposit with M-Pesa"
3. PayHero creates payment intent
4. User completes payment on PayHero UI
5. M-Pesa sends money to PayHero
6. PayHero calls webhook → Balance updated in Supabase

---

## 🔧 Setup PayHero (3 Steps)

### Step 1: Get PayHero Credentials

Go to **https://payhero.io** and:
1. Create account or login
2. Go to **Settings → API**
3. Find and copy:
   - **Basic Auth** (or Secret Key)
   - **Account ID**

### Step 2: Get M-Pesa Credentials (from PayHero)

In PayHero dashboard:
1. Navigate to **M-Pesa Integration**
2. Note the provided:
   - **M-Pesa Shortcode**
   - **Consumer Key**
   - **Consumer Secret**
   - **Account ID** (for routing)

### Step 3: Add to Environment Variables

**Local Development (.env file):**
```env
PAYHERO_BASIC_AUTH=your_basic_auth_token
PAYHERO_SECRET_KEY=your_secret_key
PAYHERO_ACCOUNT_ID=your_account_id
PAYHERO_CALLBACK_URL=http://localhost:5000/webhook/payhero
```

**Netlify Deployment (Dashboard):**
Go to **Site settings → Build & deploy → Environment**

Add each variable:
```
Key: PAYHERO_BASIC_AUTH
Value: your_basic_auth_token

Key: PAYHERO_SECRET_KEY
Value: your_secret_key

Key: PAYHERO_ACCOUNT_ID
Value: your_account_id

Key: PAYHERO_CALLBACK_URL
Value: https://your-site.netlify.app/webhook/payhero
```

---

## 🧪 Test PayHero Integration

### Test Endpoint
```bash
curl https://your-site.netlify.app/.netlify/functions/test-config
```

Expected response:
```json
{
  "success": true,
  "message": "✅ PayHero is configured",
  "config": {
    "hasBasicAuth": true,
    "hasSecretKey": true,
    "hasAccountId": true,
    "hasCallbackUrl": true,
    "allEnvVarsSet": true
  }
}
```

### Manual Payment Test

**Create Intent:**
```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/payhero-create-intent \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "phone": "+254712345678",
    "account_reference": "test-user"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "intent_id": "pi_123456",
    "payment_url": "https://payhero.io/pay/pi_123456",
    "amount": 100
  }
}
```

---

## 🌐 Webhook Configuration

### What Happens on Payment Success

1. PayHero POSTs to: `https://your-site.netlify.app/webhook/payhero`
2. Payload includes:
   ```json
   {
     "status": "completed",
     "amount": 100,
     "currency": "KES",
     "email": "user@example.com",
     "reference": "user-transaction-id"
   }
   ```
3. `webhook-payhero.js` processes webhook
4. Updates user balance in Supabase:
   - Converts KES to USD (KES / 145 = USD)
   - Adds to `real_balance`
   - Creates transaction record
5. Logs success

### Setup Webhook in PayHero

1. Go to **PayHero Dashboard → Settings → Webhooks**
2. Click **Add Webhook**
3. URL: `https://your-site.netlify.app/webhook/payhero`
4. Events: Select **payment.completed**
5. Save

---

## 💰 Payment Flow Example

### User Deposits KES 1,000 with M-Pesa

1. **User**: Opens Wallet page → Clicks "Deposit with M-Pesa"
2. **Frontend**: Sends request to `/api/payhero/create-intent`
3. **Backend**: Creates intent with PayHero
4. **PayHero**: Returns payment URL
5. **User**: Opens payment URL, enters M-Pesa PIN
6. **M-Pesa**: Processes payment
7. **PayHero**: Receives payment, calls webhook
8. **Backend**: Webhook handler:
   - Gets email from webhook
   - Finds user in Supabase
   - Converts: 1000 KES ÷ 145 = ~6.90 USD
   - Updates: `users.real_balance += 6.90`
   - Creates transaction record
9. **Frontend**: Balance updates, shows success message

---

## 📊 Supported Payment Methods

PayHero supports:

| Method | Status | Notes |
|--------|--------|-------|
| M-Pesa | ✅ Active | Integrated via STK push |
| Airtel Money | ✅ Available | Configure in PayHero |
| Bank Transfer | ✅ Available | Configure in PayHero |
| Card | ✅ Available | Configure in PayHero |

---

## 🔐 Security Best Practices

1. **Never commit credentials** - Use environment variables only
2. **Use Service Role Key** - For backend operations (Netlify Functions)
3. **Validate Webhooks** - Check webhook signature in production
4. **HTTPS Only** - Callback URL must use HTTPS
5. **Rate Limiting** - PayHero has built-in rate limits

---

## 📞 PayHero API Endpoints

Your functions call these PayHero endpoints:

| Endpoint | Purpose | Function |
|----------|---------|----------|
| `/api/stk-push` | M-Pesa prompt | `stk-push.js` |
| `/api/query` | Check payment status | `payhero-create-intent.js` |
| `/webhook` | Receive webhooks | `webhook-payhero.js` |

---

## ❌ Troubleshooting

### "PayHero is NOT configured"
- Missing environment variables
- Check **test-config** endpoint
- Verify all 4 variables set in Netlify

### Webhook not being called
- Check PayHero webhook configuration
- Verify callback URL is correct
- Check Netlify function logs for errors
- Ensure callback URL uses HTTPS

### Payment shows as pending
- Check PayHero dashboard for payment status
- User may not have completed M-Pesa PIN
- Check Supabase transaction records

### Balance not updating
- Check `webhook-payhero.js` logs
- Verify user email in webhook matches Supabase
- Check Supabase for transaction record

---

## 🚀 Next Steps

1. **Get PayHero Account** - https://payhero.io
2. **Get Credentials** - From PayHero Settings
3. **Add to .env** - For local testing
4. **Add to Netlify** - For production
5. **Set Webhook** - In PayHero dashboard
6. **Test with test-config** - Verify setup
7. **Test with manual deposit** - Create test transaction

---

## ✨ Features Enabled

With PayHero integration:
- ✅ Users can deposit via M-Pesa
- ✅ Real-time balance updates
- ✅ Automatic KES to USD conversion
- ✅ Transaction history tracking
- ✅ Webhook-based confirmation
- ✅ Admin deposit monitoring

---

## 📝 Admin Monitoring

Admin can:
1. View all deposits in **Deposits** section
2. See payment status (pending/completed/failed)
3. Monitor total revenue
4. View transaction history
5. Check M-Pesa STK push logs

---

**Your payment system is production-ready!** 🎉
