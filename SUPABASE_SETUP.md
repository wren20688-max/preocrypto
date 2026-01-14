# 🚀 Supabase Database Setup for PreoCrypto

## Why Supabase?
Your website will remember **ALL user accounts, transactions, trades, and deposits FOREVER** - just like Facebook, Twitter, or any major website. No data will ever be lost!

---

## ⚡ Quick Setup (5 Minutes)

### Step 1: Create FREE Supabase Account

1. Go to **https://supabase.com**
2. Click **"Start your project"**
3. Sign up with **GitHub** (easiest) or email
4. Verify your email if needed

### Step 2: Create New Project

1. Click **"New Project"**
2. Fill in:
   - **Name:** `preocrypto` (or any name you like)
   - **Database Password:** Create a strong password (save it!)
   - **Region:** Choose closest to you (e.g., US East, Europe West)
3. Click **"Create new project"**
4. Wait 2 minutes for database to initialize ☕

### Step 3: Set Up Database Tables

1. In your Supabase dashboard, click **"SQL Editor"** (left sidebar)
2. Click **"New query"**
3. Copy the **ENTIRE** content from the file `supabase-schema.sql` 
4. Paste it into the SQL editor
5. Click **"Run"** (or press Ctrl+Enter)
6. ✅ You should see "Success. No rows returned"

### Step 4: Get Your API Credentials

1. Click **"Settings"** (gear icon, bottom left sidebar)
2. Click **"API"**
3. Copy these two values:

   📋 **Project URL**  
   ```
   Example: https://abcxyzdefgh12345.supabase.co
   ```
   
   📋 **anon public key** (long string starting with `eyJ...`)
   ```
   Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...
   ```

### Step 5: Add to Netlify (or Vercel)

#### If using Netlify:

1. Go to **https://app.netlify.com**
2. Select your **PreoCrypto site**
3. Go to **Site settings** → **Environment variables**
4. Click **"Add a variable"** and add these 3:

```
Name: SUPABASE_URL
Value: [paste your Project URL here]

Name: SUPABASE_ANON_KEY
Value: [paste your anon public key here]

Name: JWT_SECRET
Value: preocrypto-secret-key-change-in-production-2024
```

5. Click **"Save"**

#### If using Vercel:

1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add the same 3 variables above

### Step 6: Deploy!

Commit and push your code:

```powershell
cd c:\PREOCRYPTO\preocrypto-main
git add .
git commit -m "Add Supabase database for persistent storage"
git push
```

Your site will automatically redeploy with the database!

---

## ✅ Testing Your Setup

After deployment, go to your website and:

1. **Create a new account** - it will be saved permanently!
2. **Log out and log back in** - your account persists!
3. **Check Supabase dashboard** → **Table Editor** → **users** - you'll see your account there!

### Demo Accounts (Always Available)

- **Username:** `demo` | **Password:** `demo123`
- **Username:** `admin` | **Password:** `admin123` (has admin powers)

---

## 📊 What Data is Stored Forever?

✅ **All user accounts** - usernames, emails, balances  
✅ **All transactions** - deposits, withdrawals, transfers  
✅ **All trades** - every buy/sell with profit/loss  
✅ **All deposits** - M-Pesa payments with references  
✅ **Login sessions** - token management  

Your website now works like a **REAL production website**! 🎉

---

## 🔍 View Your Data

Anytime, go to:
- **Supabase Dashboard** → **Table Editor**
- Click any table (users, transactions, trades, etc.)
- See all your data in real-time!

---

## 💡 Troubleshooting

**"Registration failed"** - Check that:
1. Environment variables are set in Netlify/Vercel
2. SQL schema was run successfully
3. Site redeployed after adding env vars

**Check Netlify Function Logs:**
1. Go to Netlify dashboard
2. Click **"Functions"**
3. Click any function to see logs

---

## 🎯 Next Steps

Your database is now ready! The website will:
- ✅ Remember all users forever
- ✅ Store all transactions and trades
- ✅ Never lose any data
- ✅ Work like Facebook, Gmail, or any major site

**You're done!** 🚀
