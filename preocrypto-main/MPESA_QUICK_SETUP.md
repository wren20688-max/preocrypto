# 🚀 Quick M-Pesa Setup - PreoCrypto

## Step 1: Add Your PayHero Credentials

Open the file `mpesa-deposit.js` and replace these lines (lines 7-8):

```javascript
const PAYHERO_CONFIG = {
  SECRET_KEY: 'YOUR_PAYHERO_SECRET_KEY_HERE',  // ← Paste your secret key here
  ACCOUNT_ID: 'YOUR_ACCOUNT_ID_HERE',           // ← Paste your account ID here
```

**With your actual credentials:**

```javascript
const PAYHERO_CONFIG = {
  SECRET_KEY: 'sk_test_abc123...',  // Your actual key
  ACCOUNT_ID: '12345',               // Your actual ID
```

---

## Step 2: Test the Integration

1. **Open the deposit page**: `http://localhost:8888/deposit.html`
2. **Enter amount**: Minimum 10 KES
3. **Enter M-Pesa phone**: Format `254712345678`
4. **Click "Deposit via M-Pesa"**
5. **Check your phone** for STK push
6. **Enter your M-Pesa PIN**
7. **Wait ~30 seconds** - Balance updates automatically!

---

## ✨ How It Works

### User Flow:
1. User fills deposit form
2. JavaScript calls PayHero API  via Netlify function
3. PayHero sends STK push to phone
4. User enters M-Pesa PIN
5. PayHero webhook notifies our server
6. Balance updates automatically

### Files Involved:
- **`deposit.html`** - M-Pesa deposit form UI
- **`mpesa-deposit.js`** - Frontend deposit handler
- **`netlify/functions/create-payment.js`** - Creates payment with PayHero
- **`netlify/functions/mpesa-callback.js`** - Receives payment confirmation

---

## 🔧 Troubleshooting

### "Payment failed"
- **Check**: Are credentials correct in `mpesa-deposit.js`?
- **Check**: Is Netlify Dev running? (`netlify dev`)
- **Check**: Do you have internet connection?

### "Invalid phone number"
- **Format**: Must be `254XXXXXXXXX` (no spaces, no +)
- **Example**: `254712345678` ✅
- **Wrong**: `+254 712 345 678` ❌

### "STK push not received"
- **Check**: Phone number is correct
- **Check**: M-Pesa is active on the phone
- **Check**: Phone has network coverage
- **Try**: Different phone number

### "Balance not updating"
- **Wait**: Can take up to 60 seconds
- **Check**: Transaction shows as "pending" in Recent Deposits
- **Demo mode**: Automatically completes after 30 seconds
- **Production**: Webhook must be configured in PayHero dashboard

---

## 📱 Production Deployment

### 1. Deploy to Netlify:
```bash
netlify deploy --prod
```

### 2. Set environment variables in Netlify:
- Go to Site Settings → Environment Variables
- Add:
  - `PAYHERO_SECRET_KEY` = your secret key
  - `PAYHERO_ACCOUNT_ID` = your account ID

### 3. Configure webhook in PayHero dashboard:
- URL: `https://your-site.netlify.app/webhook/mpesa-callback`
- Events: `payment.success`, `payment.failed`

---

## 🎯 Next Steps

Once M-Pesa works, you can add:
- ✅ Email notifications on successful deposit
- ✅ SMS confirmations
- ✅ Multiple payment methods (cards, crypto)
- ✅ Deposit limits per user
- ✅ Transaction receipts

---

**Need help?** Share your:
1. PayHero Secret Key
2. PayHero Account ID

And I'll configure everything for you! 🚀
