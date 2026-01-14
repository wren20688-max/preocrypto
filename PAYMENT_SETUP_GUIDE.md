# 💳 Payment System Setup Guide - PreoCrypto

## ✅ What You Have Already

Your payment system is **FULLY IMPLEMENTED** with the following:

### 1. **Backend Server** ✅
- `server.js` - Node.js/Express backend with payment endpoints
- `netlify/functions/` - Serverless functions for Netlify deployment
- PayHero M-PESA integration ready

### 2. **Payment Functions** ✅
- `stk-push.js` - Initiates M-PESA STK push payments
- `mpesa-callback.js` - Handles M-PESA payment confirmations
- `webhook-payhero.js` - Processes PayHero webhooks
- `payhero-create-intent.js` - Creates payment intents

### 3. **Frontend Integration** ✅
- `deposit-app.js` - Deposit form with M-PESA integration
- `payhero-integration.js` - PayHero API wrapper
- Payment methods: M-PESA, Bank Transfer, Card, Crypto, PayPal

---

## 🚀 What You Need to Make Payments Work

### Step 1: Get PayHero Account
1. Go to https://payhero.co.ke
2. Sign up for an account
3. Complete KYC verification
4. Get your API credentials

### Step 2: Environment Variables Setup

Create a `.env` file in your project root:

```env
# PayHero Credentials (REQUIRED)
PAYHERO_BASIC_AUTH=Basic YOUR_BASE64_TOKEN_HERE
PAYHERO_ACCOUNT_ID=4575
PAYHERO_API_URL=https://app.payhero.co.ke/lipwa/4575

# Your Website URL (REQUIRED)
SITE_URL=https://www.preocrypto.com
PAYHERO_CALLBACK_URL=https://www.preocrypto.com/webhook/mpesa-callback

# JWT Secret (REQUIRED)
JWT_SECRET=preocrypto-secret-key-change-in-production

# Database (REQUIRED if using Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 3: Install Dependencies

```bash
npm install
```

Required packages (already in package.json):
- express
- cors
- body-parser
- jsonwebtoken
- dotenv
- node-fetch
- bcryptjs

### Step 4: Run the Server

**For Local Testing:**
```bash
npm start
# Server runs on http://localhost:3001
```

**For Development with Auto-reload:**
```bash
npm run dev
# Uses nodemon for automatic restarts
```

---

## 🌐 Deployment Options

### Option A: Deploy to Netlify (Recommended)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Netlify:**
   - Go to https://netlify.com
   - Click "New site from Git"
   - Connect your GitHub repository
   - Deploy settings:
     - Build command: `npm install`
     - Publish directory: `.`
     - Functions directory: `netlify/functions`

3. **Set Environment Variables in Netlify:**
   - Go to Site settings → Environment variables
   - Add all variables from `.env` file

4. **Your site will be live at:**
   ```
   https://your-site-name.netlify.app
   ```

### Option B: Deploy to Heroku

1. **Create Heroku app:**
   ```bash
   heroku create preocrypto-app
   ```

2. **Set environment variables:**
   ```bash
   heroku config:set PAYHERO_BASIC_AUTH="Basic YOUR_TOKEN"
   heroku config:set PAYHERO_ACCOUNT_ID=4575
   heroku config:set SITE_URL="https://preocrypto-app.herokuapp.com"
   ```

3. **Deploy:**
   ```bash
   git push heroku main
   ```

### Option C: Deploy to VPS (DigitalOcean, AWS, etc.)

1. **SSH to your server**
2. **Install Node.js:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Clone your repo:**
   ```bash
   git clone https://github.com/yourusername/preocrypto.git
   cd preocrypto
   ```

4. **Install dependencies:**
   ```bash
   npm install
   ```

5. **Create .env file:**
   ```bash
   nano .env
   # Paste your environment variables
   ```

6. **Run with PM2 (process manager):**
   ```bash
   npm install -g pm2
   pm2 start server.js --name preocrypto
   pm2 save
   pm2 startup
   ```

7. **Setup Nginx reverse proxy** (optional but recommended):
   ```nginx
   server {
       server_name preocrypto.com;
       location / {
           proxy_pass http://localhost:3001;
       }
   }
   ```

---

## 🔧 Testing Payments Locally

### 1. Use ngrok for Webhook Testing

```bash
# Install ngrok: https://ngrok.com/download

# Start your server
npm start

# In another terminal, expose it:
ngrok http 3001

# You'll get a URL like: https://abc123.ngrok.io
```

### 2. Update Environment Variables

```env
SITE_URL=https://abc123.ngrok.io
PAYHERO_CALLBACK_URL=https://abc123.ngrok.io/webhook/mpesa-callback
```

### 3. Configure PayHero Webhook

1. Login to PayHero dashboard
2. Go to Settings → Webhooks
3. Add webhook URL: `https://abc123.ngrok.io/webhook/mpesa-callback`
4. Save

### 4. Test Deposit

1. Open http://localhost:5500/finances.html (or your Live Server)
2. Enter amount (minimum 10 KES for M-PESA testing)
3. Enter Kenyan phone number (254XXXXXXXXX)
4. Click "Deposit with M-PESA"
5. You'll receive STK push on your phone
6. Enter M-PESA PIN
7. Balance updates automatically via webhook!

---

## 📱 M-PESA Testing

### Test Phone Numbers (Sandbox)
- Use your real Kenyan number for testing
- Amount: Start with 10 KES minimum
- Format: 254712345678 (not 0712345678)

### Common Issues & Fixes

**"Phone number invalid"**
- Ensure format: 254XXXXXXXXX
- Remove spaces, dashes, parentheses

**"Payment failed"**
- Check your M-PESA balance
- Ensure PIN is correct
- Try smaller amount first (10 KES)

**"Webhook not received"**
- Verify ngrok is running
- Check PAYHERO_CALLBACK_URL matches ngrok URL
- Check server logs: `pm2 logs preocrypto`

**"Balance not updating"**
- Check webhook received: Look at server logs
- Verify webhook handler processes correctly
- Check browser console for errors

---

## 🔐 Security Checklist

- [ ] Never commit `.env` file (already in .gitignore)
- [ ] Use strong JWT_SECRET in production
- [ ] Enable HTTPS (free with Netlify/Heroku)
- [ ] Verify webhook signatures from PayHero
- [ ] Rate limit API endpoints (already implemented)
- [ ] Sanitize user inputs (already implemented)

---

## 📊 Current Status

✅ **Backend**: Fully implemented
✅ **Frontend**: Fully integrated
✅ **M-PESA**: Ready to use
✅ **Webhooks**: Configured
✅ **Database**: Using localStorage + optional Supabase

## ⚠️ What You Need to Do

1. **Get PayHero credentials** (PAYHERO_BASIC_AUTH)
2. **Create .env file** with your credentials
3. **Deploy to Netlify/Heroku** (or run locally)
4. **Configure webhook URL** in PayHero dashboard
5. **Test with real M-PESA account**

---

## 🆘 Support

If you get stuck:

1. **Check server logs:**
   ```bash
   # Local
   npm start
   
   # Heroku
   heroku logs --tail
   
   # PM2
   pm2 logs preocrypto
   ```

2. **Test webhook manually:**
   ```bash
   curl -X POST http://localhost:3001/webhook/mpesa-callback \
     -H "Content-Type: application/json" \
     -d '{"status":"success","amount":100,"phone":"254712345678"}'
   ```

3. **Check PayHero dashboard** for payment status

---

## 💡 Quick Start Summary

```bash
# 1. Install dependencies
npm install

# 2. Create .env file with your credentials
cp .env.example .env
# Edit .env with your PayHero credentials

# 3. Start server
npm start

# 4. Open in browser
# http://localhost:5500 (frontend)
# http://localhost:3001 (backend)

# 5. Test deposit on finances.html
```

**That's it! Your payment system is ready to go! 🚀**
