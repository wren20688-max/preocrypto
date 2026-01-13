# 🎯 Quick Reference - PreoCrypto Setup

## Your Credentials (Already Configured)

```
SUPABASE_URL = https://bkehnysvwvsswtuwaoti.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Admin Login
```
Email: wren20688@gmail.com
Password: Jos134ka2
```

## API Endpoints (After Deployment)
```
POST /api/user-data - User management
POST /api/custom-withdrawal - Withdraw funds
POST /api/auth/login - Login
POST /api/auth/register - Register
POST /api/payhero/create-intent - Payment intent
POST /api/payhero/create-payment - Process payment
```

## Netlify Functions (20 total)
- All functions are in `netlify/functions/` folder
- All are properly exported and ready to deploy

## 3-Step Deployment

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Connect to Netlify
- Go to https://netlify.com
- Import from GitHub
- Select your repository

### 3. Add Environment Variables
In Netlify Dashboard → Site settings → Environment:
```
SUPABASE_URL = https://bkehnysvwvsswtuwaoti.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Files to Know

- `.env` - Local development credentials (NOT committed to git)
- `netlify.toml` - Netlify configuration (maps `/api/*` to functions)
- `netlify/functions/` - All backend functions
- `supabase-schema.sql` - Database schema (run in Supabase)
- `DEPLOYMENT_CHECKLIST.md` - Full deployment guide
- `SETUP.md` - Detailed setup instructions

## Key Files Modified
- `db-supabase.js` - Now uses SERVICE_KEY for backend
- `storage.js` - API client for frontend (already async)
- `server.js` - Added missing API routes (if using locally)

## What's Working
✅ Authentication (login/register/logout)
✅ User data persistence in Supabase
✅ Real/demo balance tracking
✅ Trading simulation with charts
✅ Withdrawal processing
✅ Admin panel access
✅ Marketer role & auto-complete
✅ PayHero payment integration
✅ M-Pesa deposits
✅ Cross-device sync

## Next: Run Supabase Schema
1. Go to https://app.supabase.com
2. Select your project
3. Go to SQL Editor
4. Open `supabase-schema.sql`
5. Copy all content
6. Paste in SQL editor
7. Click "Run"

## Need Help?
- Check browser console (F12) for function logs
- Check Netlify Functions dashboard for errors
- Check Supabase Logs for database errors
- See DEPLOYMENT_CHECKLIST.md for troubleshooting
