# 🚀 PayHero Integration Setup Guide

Complete step-by-step guide to integrate PayHero payments into PreoCrypto.

## 📋 Prerequisites

1. ✅ Node.js installed (v16 or higher)
2. ✅ Netlify CLI installed: `npm install -g netlify-cli`
3. ✅ PayHero account (sign up at https://payhero.io)

---

## Step 1: Get PayHero Credentials

### 1.1 Create PayHero Account
1. Go to https://payhero.io
2. Sign up for an account
3. Complete verification process

### 1.2 Get API Credentials
1. Login to https://dashboard.payhero.io
2. Navigate to **Settings** → **API Keys**
3. Copy your:
   - **Secret Key** (starts with `sk_`)
   - **Account ID** (numeric ID)

---

## Step 2: Configure Environment Variables

### 2.1 Create Local .env File
Create a file named `.env` in your project root:

```bash
# Copy from .env.example
PAYHERO_SECRET_KEY=sk_test_your_secret_key_here
PAYHERO_ACCOUNT_ID=12345
PAYHERO_CALLBACK_URL=http://localhost:8888/webhook/mpesa-callback
```

### 2.2 Configure Netlify Environment Variables (for production)

#### Option A: Using Netlify CLI
```bash
netlify env:set PAYHERO_SECRET_KEY "sk_live_your_key"
netlify env:set PAYHERO_ACCOUNT_ID "12345"
```

#### Option B: Using Netlify Dashboard
1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add these variables:
   - `PAYHERO_SECRET_KEY` = your secret key
   - `PAYHERO_ACCOUNT_ID` = your account ID
   - `PAYHERO_CALLBACK_URL` = https://your-site.netlify.app/webhook/mpesa-callback

---

## Step 3: Install Dependencies

```bash
# Navigate to functions directory
cd netlify/functions

# Install required packages
npm install node-fetch

# Go back to root
cd ../..
```

---

## Step 4: Start Development Server

```bash
# Start Netlify Dev (includes functions)
netlify dev
```

This will start:
- Frontend on: http://localhost:8888
- Functions on: http://localhost:8888/.netlify/functions/*

---

## Step 5: Test the Integration

### 5.1 Test M-Pesa Deposit
1. Navigate to http://localhost:8888/deposit.html
2. Select **M-Pesa** payment method
3. Enter amount (minimum 10 KES)
4. Enter M-Pesa phone number (format: 254712345678)
5. Click **Submit Deposit**
6. Check your M-Pesa phone for STK push prompt
7. Enter your M-Pesa PIN
8. Wait for confirmation

### 5.2 Check Logs
Monitor the Netlify Dev console for:
- Payment request logs
- PayHero API responses
- Webhook callbacks

---

## Step 6: Configure Webhooks

### 6.1 Set Webhook URL in PayHero Dashboard
1. Go to https://dashboard.payhero.io
2. Navigate to **Settings** → **Webhooks**
3. Add webhook URL:
   - **Local testing**: `http://localhost:8888/webhook/mpesa-callback`
   - **Production**: `https://your-site.netlify.app/webhook/mpesa-callback`
4. Select events to receive:
   - ✅ `payment.success`
   - ✅ `payment.failed`
   - ✅ `payment.pending`

### 6.2 Test Webhook
The webhook will automatically update user balances when payments complete.

---

## 🔧 Troubleshooting

### Issue: "Invalid API credentials"
**Solution**: 
- Verify PAYHERO_SECRET_KEY is correct
- Ensure PAYHERO_ACCOUNT_ID matches your account
- Check if key starts with `sk_test_` or `sk_live_`

### Issue: "Webhook not receiving callbacks"
**Solution**:
- Ensure webhook URL is publicly accessible
- For local testing, use ngrok: `ngrok http 8888`
- Update webhook URL in PayHero dashboard

### Issue: "STK Push not received"
**Solution**:
- Verify phone number format (254XXXXXXXXX)
- Check if M-Pesa is active on the phone
- Ensure sufficient M-Pesa balance for test

### Issue: "Payment created but balance not updating"
**Solution**:
- Check webhook is configured correctly
- Verify webhook handler is processing events
- Check browser console and Netlify function logs

---

## 📱 Payment Methods

### M-Pesa (Kenya)
- **Method**: `mpesa_stk`
- **Currency**: KES
- **Min**: 10 KES
- **Max**: 500,000 KES
- **Time**: Instant (30 seconds)
- **Fee**: ~1.5%

### Bank Transfer
- **Method**: `bank_transfer`
- **Currency**: USD
- **Min**: $10
- **Max**: $100,000
- **Time**: 1-3 business days
- **Fee**: 0.5%

### Credit Card
- **Method**: `credit_card`
- **Currency**: USD
- **Min**: $10
- **Max**: $50,000
- **Time**: Instant
- **Fee**: 2.9% + $0.30

### Cryptocurrency
- **Method**: `crypto`
- **Currency**: USD (converted to crypto)
- **Min**: $25
- **Max**: $100,000
- **Time**: 5-15 minutes
- **Fee**: 1%

---

## 🔐 Security Best Practices

1. **Never commit** `.env` file to Git
2. Use **test keys** for development (`sk_test_...`)
3. Use **live keys** only in production (`sk_live_...`)
4. Enable **webhook signature verification**
5. Validate all amounts server-side
6. Log all transactions for audit trail

---

## 📊 Testing Checklist

- [ ] PayHero credentials configured
- [ ] Netlify Dev running successfully
- [ ] Can access deposit page
- [ ] M-Pesa payment creates STK push
- [ ] Webhook receives payment confirmation
- [ ] User balance updates correctly
- [ ] Transaction appears in history
- [ ] Error handling works properly

---

## 🚀 Going Live

### Pre-Launch Checklist
- [ ] Replace test credentials with live credentials
- [ ] Update webhook URL to production domain
- [ ] Test with small real transaction
- [ ] Monitor first few live transactions
- [ ] Set up error alerting
- [ ] Configure backup payment methods

### Deploy to Netlify
```bash
# Deploy site
netlify deploy --prod

# Verify environment variables
netlify env:list
```

---

## 📚 Additional Resources

- PayHero API Docs: https://docs.payhero.io
- M-Pesa Integration Guide: https://developer.safaricom.co.ke
- Netlify Functions: https://docs.netlify.com/functions/overview/
- Support: support@payhero.io

---

## 💡 Quick Start Commands

```bash
# Initial setup
npm install -g netlify-cli
cd netlify/functions && npm install && cd ../..

# Development
netlify dev

# Deploy
netlify deploy --prod

# Check logs
netlify functions:log create-payment
```

---

**Need Help?** Check the troubleshooting section or contact PayHero support.
