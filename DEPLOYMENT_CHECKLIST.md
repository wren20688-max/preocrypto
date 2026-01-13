# 🚀 PreoCrypto Netlify Deployment Checklist

## ✅ What's Ready

### Environment Configuration
- ✅ `.env` file created with Supabase credentials
- ✅ `SUPABASE_URL` configured
- ✅ `SUPABASE_ANON_KEY` configured  
- ✅ `SUPABASE_SERVICE_KEY` configured (for backend operations)
- ✅ `.gitignore` created (protects `.env` from git)

### Netlify Functions (20 total)
- ✅ `user-data.js` - User CRUD operations
- ✅ `custom-withdrawal.js` - Withdrawal handler
- ✅ `auth-login.js` - Login authentication
- ✅ `auth-register.js` - User registration
- ✅ `auth-identify.js` - Token verification
- ✅ `payhero-create-intent.js` - Payment intent creation
- ✅ `payhero-create-payment.js` - Payment processing
- ✅ `payment-intent.js` - Generic payment intent
- ✅ `create-payment.js` - Payment creation
- ✅ `stk-push.js` - M-Pesa STK push
- ✅ `mpesa-callback.js` - M-Pesa webhook
- ✅ `webhook-payhero.js` - PayHero webhook
- ✅ `admin-users.js` - Admin user management
- ✅ `admin-add-marketer.js` - Add marketer role
- ✅ `admin-remove-marketer.js` - Remove marketer role
- ✅ `admin-deposits-summary.js` - Deposit analytics
- ✅ `enforce-marketer-profits.js` - Profit enforcement
- ✅ `user-balance.js` - Balance query
- ✅ `test-config.js` - Configuration test
- ✅ `db-supabase.js` - Database helper (uses SERVICE_KEY)

### Frontend
- ✅ `storage.js` - API client for user-data endpoint
- ✅ `dashboard.html` - Dashboard with charts
- ✅ `finances.html` - Withdrawal page
- ✅ `auto-trading.html` - Auto-trading page
- ✅ All HTML pages configured for `/api/*` routes

### Documentation
- ✅ `SETUP.md` - Setup instructions
- ✅ `verify-setup.ps1` - Windows verification script
- ✅ `verify-setup.sh` - Linux/Mac verification script

---

## 📋 Deployment Steps

### Step 1: Prepare Code for GitHub (Do This First)
```bash
# 1. Initialize git (if not already done)
git init
git add .
git commit -m "PreoCrypto: Netlify Functions + Supabase setup"

# 2. Create .gitignore (already created)
# It will exclude: .env, node_modules/, .netlify/

# 3. Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/preocrypto.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Netlify
Option A: Deploy via Dashboard (Recommended)
```
1. Go to https://netlify.com/
2. Click "Add new site" → "Import an existing project"
3. Select GitHub → Choose your repository
4. Build settings:
   - Build command: (leave empty)
   - Publish directory: ./
   - Functions directory: netlify/functions
5. Click "Deploy site"
```

Option B: Deploy via CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy production
netlify deploy --prod
```

### Step 3: Add Environment Variables to Netlify
1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Build & deploy** → **Environment**
3. Click **Add environment variable**
4. Add each variable:
   ```
   Key: SUPABASE_URL
   Value: https://bkehnysvwvsswtuwaoti.supabase.co
   
   Key: SUPABASE_ANON_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   
   Key: SUPABASE_SERVICE_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
5. Click **Save**
6. Trigger a new deploy (or push to main branch)

### Step 4: Verify Supabase Schema
1. Go to your Supabase project: https://app.supabase.com/
2. Navigate to **SQL Editor**
3. Copy content from `supabase-schema.sql`
4. Paste and run in SQL Editor
5. Verify all tables created:
   - `users`
   - `tokens`
   - `transactions`
   - `trades`
   - `deposits`
   - `withdrawals`
   - `admin_audit_log`

---

## 🧪 Testing After Deployment

### Test Endpoints
```javascript
// Test user-data endpoint
POST /api/user-data
{
  "action": "getUser",
  "payload": { "username": "test@example.com" }
}

// Test custom withdrawal
POST /api/custom-withdrawal
{
  "username": "test@example.com",
  "amount": 100,
  "phone": "+254712345678",
  "method": "mpesa"
}

// Test login
POST /api/auth/login
{
  "email": "wren20688@gmail.com",
  "password": "Jos134ka2"
}
```

### Browser Console
1. Open your site in browser
2. Press F12 → Console
3. Look for log messages:
   - `✅ Supabase client initialized` = Functions are working
   - `⚠️ Supabase not configured` = Missing environment variables
   - `Failed to load resource: the server responded with a status of 404` = Function not found

---

## 🔒 Security Notes

1. **Never commit `.env`** - It's in `.gitignore`
2. **Service Key is sensitive** - Only use on backend (Netlify Functions)
3. **Anon Key is public** - OK to expose in frontend code
4. **Rotate keys regularly** - Go to Supabase Settings → API

---

## 📞 Troubleshooting

### 404 Errors on `/api/` routes
- ❌ Problem: Functions not found
- ✅ Solution: Check environment variables in Netlify Dashboard

### "Supabase not configured" logs
- ❌ Problem: `SUPABASE_URL` or `SUPABASE_SERVICE_KEY` missing
- ✅ Solution: Add to Netlify environment variables (Step 3)

### Database errors
- ❌ Problem: Can't connect to Supabase
- ✅ Solution: Run `supabase-schema.sql` in Supabase SQL Editor

### Withdrawal returning 404
- ❌ Problem: `/api/custom-withdrawal` not found
- ✅ Solution: Function exists, ensure environment variables set

---

## 📊 Monitoring

After deployment, monitor your Netlify Functions:
1. Go to **Functions** tab in Netlify dashboard
2. View logs for each function
3. Check for errors and performance

Monitor your Supabase:
1. Go to **Database** → **Tables** to view data
2. Go to **Logs** to see query activity
3. Check **API Usage** for rate limits

---

## ✨ You're All Set!

Your PreoCrypto app is now:
- ✅ Using Netlify Functions for backend
- ✅ Connected to Supabase for persistent storage
- ✅ Protected with environment variables
- ✅ Scaled for unlimited users
- ✅ Cross-device sync enabled
- ✅ Ready for production

Site will be available at: `https://your-site.netlify.app`
