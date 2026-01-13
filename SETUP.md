# PreoCrypto - Netlify Functions + Supabase Setup

## ✅ Configuration Complete

### Environment Variables Set
- ✅ SUPABASE_URL: `https://bkehnysvwvsswtuwaoti.supabase.co`
- ✅ SUPABASE_ANON_KEY: Configured
- ✅ SUPABASE_SERVICE_KEY: Configured (for backend operations)

### Netlify Functions Available
```
/.netlify/functions/user-data → /api/user-data
/.netlify/functions/custom-withdrawal → /api/custom-withdrawal
/.netlify/functions/auth-login → /api/auth/login
/.netlify/functions/auth-register → /api/auth/register
/.netlify/functions/payhero-create-intent → /api/payhero/create-intent
/.netlify/functions/payhero-create-payment → /api/payhero/create-payment
```

## 🚀 Deployment Steps

### Option 1: Deploy to Netlify (Recommended)
1. Push your code to GitHub/GitLab/Bitbucket
2. Connect your repo to Netlify
3. In Netlify Dashboard → Site settings → Build & deploy → Environment:
   ```
   SUPABASE_URL = https://bkehnysvwvsswtuwaoti.supabase.co
   SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
4. Netlify will auto-deploy on every push

### Option 2: Local Testing with Netlify CLI
1. Install Netlify CLI: `npm install -g netlify-cli`
2. Run: `netlify dev`
3. Your app runs on `http://localhost:8888`
4. Functions run on `http://localhost:8888/.netlify/functions/*`

### Option 3: Deploy Using Netlify CLI
```bash
netlify deploy --prod
```

## 📊 Database Schema

Run this in your Supabase SQL Editor to set up tables:
- See: `supabase-schema.sql` (already prepared)

Key tables created:
- `users` - User accounts with balances
- `trades` - Trading history
- `transactions` - All financial records
- `deposits` - Payment tracking
- `withdrawals` - Withdrawal requests
- `admin_audit_log` - Admin actions

## 🔑 Admin Account

Email: `wren20688@gmail.com`
Password: `Jos134ka2`

## ✨ Features Enabled

- ✅ User authentication via Supabase
- ✅ Real/demo balance tracking
- ✅ Marketer role with auto-complete withdrawals
- ✅ Trading simulation with real-time charts
- ✅ Payment integration (PayHero)
- ✅ Admin panel with full control
- ✅ M-Pesa deposits (via PayHero)

## 🐛 Testing

Check console for logs:
- Functions show `✅ Supabase client initialized` on first call
- Errors show `⚠️ Supabase not configured` if env vars missing

## 📝 Notes

- `.env` file has local development credentials
- Never commit `.env` file to git (added to .gitignore)
- Functions use SERVICE_KEY for backend operations
- All user data persists in Supabase
- Cross-device sync enabled via cloud database
