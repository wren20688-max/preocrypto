
// Import express and required modules
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

// Load environment variables from .env file
require('dotenv').config();

const app = express();
// Enable JSON and URL-encoded body parsing for all requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

const DB_PATH = path.join(__dirname, 'db.json');
const JWT_SECRET = process.env.JWT_SECRET || 'preocrypto-secret-key-2024';
// PayHero integration settings - use environment variables (do NOT commit secrets)
const PAYHERO_BASIC_AUTH = process.env.PAYHERO_BASIC_AUTH || '';
const PAYHERO_SECRET_KEY = process.env.PAYHERO_SECRET_KEY || '';
const PAYHERO_ACCOUNT_ID = process.env.PAYHERO_ACCOUNT_ID ? Number(process.env.PAYHERO_ACCOUNT_ID) : null;
const PAYHERO_CALLBACK_URL = process.env.PAYHERO_CALLBACK_URL || 'https://www.preocrypto.com/webhook/mpesa-callback';
// Public site URL used for redirect targets (set SITE_URL in Netlify env or .env)
const SITE_URL = process.env.SITE_URL || 'https://your-site.netlify.app';

// Debug: keep the last PayHero intent logs for easy inspection via browser
let lastPayheroIntentLogs = null;

// ============================================================================
// DEMO USERS FOR TESTING
// ============================================================================

const DEMO_USERS = {
  'trader1@demo.local': { password: 'pass123', username: 'trader1@demo.local', name: 'Demo Trader' },
  'admin@demo.local': { password: 'admin123', username: 'admin@demo.local', name: 'Admin User', isAdmin: true }
};

// Ensure the requested admin account exists in the DB for demo environments
(() => {
  try {
    const AUTO_ADMIN_EMAIL = 'wren20688@gmail.com';
    const AUTO_ADMIN_PASSWORD = 'Jos134ka2';
    const db = loadDB();
    if (!db.users) db.users = {};
    if (!db.users[AUTO_ADMIN_EMAIL]) {
      db.users[AUTO_ADMIN_EMAIL] = {
        username: AUTO_ADMIN_EMAIL,
        password: AUTO_ADMIN_PASSWORD,
        name: 'Preo Admin',
        email: AUTO_ADMIN_EMAIL,
        country: null,
        demoBalance: 10000,
        realBalance: 0,
        createdAt: new Date(),
        isAdmin: true
      };
      saveDB(db);
      console.log('[server] Auto-created admin:', AUTO_ADMIN_EMAIL);
    }
  } catch (e) {
    console.warn('[server] Failed to auto-create admin user', e && e.message);
  }
})();

// ============================================================================
// DATABASE HELPERS
// ============================================================================

function loadDB() {
  try {
    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    // Ensure new containers exist
    if (!data.resetCodes) data.resetCodes = {};
    return data;
  } catch {
    return { 
      users: {}, 
      tokens: [],
      privileged: [], 
      withdrawals: [], 
      trades: [], 
      payments: [],
      transactions: [],
      resetCodes: {}
    };
  }
}

function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// ============================================================================
// CURRENCY CONVERSION HELPERS
// ============================================================================

const FX_RATES = {
  KES: 130,   // Kenya Shilling per USD (approx)
  NGN: 1500,  // Nigeria Naira per USD (example)
  ZAR: 18.5,  // South African Rand per USD (example)
  GHS: 14.0   // Ghana Cedi per USD (example)
};

function getUserCountry(db, username) {
  const user = db.users[username] || DEMO_USERS[username] || {};
  return user.country || null;
}

function convertLocalAmount(db, username, amountUSD) {
  const country = getUserCountry(db, username);
  if (!country) return null;
  switch (country.toUpperCase()) {
    case 'KE':
    case 'KENYA':
      return { currency: 'KES', amount: Math.round(amountUSD * FX_RATES.KES) };
    case 'NG':
    case 'NIGERIA':
      return { currency: 'NGN', amount: Math.round(amountUSD * FX_RATES.NGN) };
    case 'ZA':
    case 'SOUTH AFRICA':
      return { currency: 'ZAR', amount: Math.round(amountUSD * FX_RATES.ZAR * 100) / 100 };
    case 'GH':
    case 'GHANA':
      return { currency: 'GHS', amount: Math.round(amountUSD * FX_RATES.GHS * 100) / 100 };
    default:
      return null;
  }
}

// ============================================================================
// MARKET DATA SIMULATION
// ============================================================================

const MARKET_DATA = {
  'EUR/USD': { price: 1.0945, bid: 1.0944, ask: 1.0946, change: 0.12 },
  'GBP/USD': { price: 1.2638, bid: 1.2637, ask: 1.2639, change: -0.15 },
  'USD/JPY': { price: 149.48, bid: 149.47, ask: 149.49, change: 0.08 },
  'Bitcoin': { price: 45230, bid: 45225, ask: 45235, change: 2.34 },
  'Ethereum': { price: 2450, bid: 2448, ask: 2452, change: 1.82 }
};

// ============================================================================
// TRADER TIER SYSTEM
// ============================================================================

function isPrivilegedTrader(db, username) {
  return db.privileged && db.privileged.includes(username);
}

function getWinRateForTrader(username, account, db) {
  const isPrivileged = isPrivilegedTrader(db, username);
  
  if (account === 'real') {
    return isPrivileged ? 0.70 : 0.20; // 70% privileged, 20% regular on real
  } else {
    return isPrivileged ? 0.90 : 0.80; // 90% privileged, 80% regular on demo
  }
}

function getMarketPrice(symbol) {
  let data = MARKET_DATA[symbol];
  if (!data) return null;
  
  // Simulate real-time price changes
  const volatility = symbol.includes('USD') ? 0.0001 : 50;
        // Backwards-compatible payment intent endpoint moved to top-level
});

// Identify user by username or email for troubleshooting/login assistance
app.post('/api/auth/identify', (req, res) => {
  const { identifier } = req.body;
  if (!identifier) return res.status(400).json({ error: 'Identifier required' });
  const db = loadDB();
  let user = db.users[identifier];
  if (!user && identifier.includes('@')) {
    const identLower = identifier.toLowerCase();
    user = Object.values(db.users).find(u => u.email && u.email.toLowerCase() === identLower);
  }
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({ username: user.username, email: user.email || null, name: user.name || null, createdAt: user.createdAt });
});

app.post('/api/auth/register', (req, res) => {
  const { username, password, name, email, country } = req.body;

  // Require email in addition to username/password/name
  if (!username || !password || !name || !email) {
    return res.status(400).json({ error: 'Username, password, name and email are required' });
  }
  
  const db = loadDB();
  
  // Check existing by username or email
  const existsByEmail = email ? Object.values(db.users).find(u => u.email && u.email.toLowerCase() === email.toLowerCase()) : null;
  if (db.users[username] || existsByEmail || DEMO_USERS[username]) {
    return res.status(400).json({ error: 'User already exists' });
  }
  
  db.users[username] = {
    username,
    password,
    name,
    email,
    country: country || null,
    demoBalance: 10000,
    realBalance: 0,
    createdAt: new Date(),
    isAdmin: false
  };
  
  saveDB(db);
  
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ success: true, token, user: { username, name } });
});

// User login - supports demo users and stored users
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  const db = loadDB();

  // Try direct username match first
  let user = db.users[username] || DEMO_USERS[username];
  // If identifier is an email, try to find by email
  if (!user && username.includes('@')) {
    const identLower = username.toLowerCase();
    user = Object.values(db.users).find(u => u.email && u.email.toLowerCase() === identLower) || Object.values(DEMO_USERS).find(u => u.username && u.username.toLowerCase() === identLower);
  }

  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  // Password check (note: demo/stored passwords are plaintext in this demo)
  if (!user.password || String(user.password) !== String(password)) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ username: user.username || username }, JWT_SECRET, { expiresIn: '24h' });
  // store token for logout support
  const db2 = loadDB();
  db2.tokens = db2.tokens || [];
  db2.tokens.push({ token, username: user.username || username, issuedAt: new Date() });
  saveDB(db2);

  return res.json({ success: true, token, user: { username: user.username || username, name: user.name || user.username || username, email: user.email || null, isAdmin: !!user.isAdmin } });
});

app.post('/api/auth/logout', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    const db = loadDB();
    db.tokens = db.tokens.filter(t => t.token !== token);
    saveDB(db);
  }
  res.json({ success: true });
});

// ============================================================================
// PASSWORD RESET ENDPOINTS
// ============================================================================

app.post('/api/auth/forgot', (req, res) => {
  const { identifier } = req.body; // email or username
  if (!identifier) return res.status(400).json({ error: 'Identifier required' });

  const db = loadDB();
  let username = identifier;
  let user = db.users[identifier];
  if (!user && identifier.includes('@')) {
    const identLower = identifier.toLowerCase();
    user = Object.values(db.users).find(u => u.email && u.email.toLowerCase() === identLower);
    username = user?.username;
  }
  if (!user) return res.status(404).json({ error: 'User not found' });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  db.resetCodes[username] = { code, expiresAt };
  saveDB(db);

  // In production, email/SMS the code. For now, return it for UX.
  res.json({ success: true, message: 'Reset code generated', code, expiresAt });
});

app.post('/api/auth/reset', (req, res) => {
  const { identifier, code, newPassword } = req.body;
  if (!identifier || !code || !newPassword) {
    return res.status(400).json({ error: 'Identifier, code and newPassword required' });
  }

  const db = loadDB();
  let username = identifier;
  let user = db.users[identifier];
  if (!user && identifier.includes('@')) {
    const identLower = identifier.toLowerCase();
    user = Object.values(db.users).find(u => u.email && u.email.toLowerCase() === identLower);
    username = user?.username;
  }
  if (!user) return res.status(404).json({ error: 'User not found' });

  const entry = db.resetCodes[username];
  if (!entry) return res.status(400).json({ error: 'No reset request found' });
  if (entry.code !== code) return res.status(400).json({ error: 'Invalid code' });
  if (new Date(entry.expiresAt) < new Date()) return res.status(400).json({ error: 'Code expired' });

  user.password = newPassword;
  delete db.resetCodes[username];
  saveDB(db);

  res.json({ success: true });
});

// ============================================================================
// MIDDLEWARE - VERIFY TOKEN
// ============================================================================

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ============================================================================
// USER MANAGEMENT ENDPOINTS
// ============================================================================

app.get('/api/user/profile', verifyToken, (req, res) => {
  const db = loadDB();
  const user = db.users[req.user.username] || DEMO_USERS[req.user.username];
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json({
    username: user.username,
    name: user.name,
    email: user.email,
    phone: user.phone,
    createdAt: user.createdAt,
    isAdmin: user.isAdmin || false
  });
});

app.put('/api/user/profile', verifyToken, (req, res) => {
  const { name, email, phone } = req.body;
  const db = loadDB();
  
  if (!db.users[req.user.username]) {
    db.users[req.user.username] = { username: req.user.username };
  }
  
  const user = db.users[req.user.username];
  if (name) user.name = name;
  if (email) user.email = email;
  if (phone) user.phone = phone;
  
  saveDB(db);
  res.json({ success: true, user });
});

// ============================================================================
// BALANCE MANAGEMENT ENDPOINTS
// ============================================================================

app.get('/api/user/:username/balance', (req, res) => {
  const { username } = req.params;
  const { account } = req.query;
  const db = loadDB();
  
  let user = db.users[username];
  if (!user) {
    user = DEMO_USERS[username];
  }
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const balance = account === 'real' ? 
    (user.realBalance || 0) : 
    (user.demoBalance || 10000);
  
  res.json({ balance });
});

app.post('/api/user/balance/update', verifyToken, (req, res) => {
  const { account, amount } = req.body;
  const db = loadDB();
  
  if (!db.users[req.user.username]) {
    db.users[req.user.username] = { username: req.user.username };
  }
  
  const balanceKey = account === 'real' ? 'realBalance' : 'demoBalance';
  db.users[req.user.username][balanceKey] = (db.users[req.user.username][balanceKey] || 10000) + amount;
  
  saveDB(db);
  res.json({ success: true, newBalance: db.users[req.user.username][balanceKey] });
});

// ============================================================================
// TRADE EXECUTION ENDPOINTS
// ============================================================================

app.post('/api/trade/execute', verifyToken, (req, res) => {
  const { pair, type, volume, stopLoss, takeProfit, account } = req.body;
  const db = loadDB();
  const market = getMarketPrice(pair);
  
  if (!market) {
    return res.status(400).json({ error: 'Invalid trading pair' });
  }

  // Enforce minimum balance requirement for real accounts
  const balanceKeyExec = (account === 'real') ? 'realBalance' : 'demoBalance';
  const currentBalanceExec = db.users[req.user.username]?.[balanceKeyExec] || (balanceKeyExec === 'demoBalance' ? 10000 : 0);
  if (account === 'real' && currentBalanceExec < 15) {
    return res.status(400).json({ error: 'Minimum account balance to trade is $15' });
  }
  
  const entryPrice = type === 'BUY' ? market.ask : market.bid;
  
  const trade = {
    id: Date.now().toString(),
    username: req.user.username,
    pair,
    type,
    volume,
    entryPrice,
    stopLoss,
    takeProfit,
    account: account || 'demo',
    status: 'open',
    openTime: new Date(),
    closePrice: null,
    closeTime: null,
    pnl: 0
  };
  
  if (!db.trades) db.trades = [];
  db.trades.push(trade);
  
  if (!db.transactions) db.transactions = [];
  db.transactions.push({
    id: Date.now().toString(),
    username: req.user.username,
    type: 'trade_open',
    pair,
    amount: volume * entryPrice,
    timestamp: new Date()
  });
  
  saveDB(db);
  res.json({ success: true, trade });
});

app.get('/api/trades/open', verifyToken, (req, res) => {
  const { account } = req.query;
  const db = loadDB();
  const trades = (db.trades || []).filter(t => 
    t.username === req.user.username && 
    t.account === (account || 'demo') && 
    t.status === 'open'
  );
  res.json(trades);
});

app.post('/api/trade/:id/close', verifyToken, (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  const trade = db.trades.find(t => t.id === id && t.username === req.user.username);
  
  if (!trade) {
    return res.status(404).json({ error: 'Trade not found' });
  }
  
  const market = getMarketPrice(trade.pair);
  const closePrice = trade.type === 'BUY' ? market.bid : market.ask;
  
  // Use trader tier system to determine if trade wins or loses
  const winRate = getWinRateForTrader(req.user.username, trade.account, db);
  const isWinning = Math.random() < winRate;
  
  // Calculate P&L based on win/loss and SL/TP percentages
  let pnl;
  if (isWinning) {
    // Calculate profit based on TP percentage
    const profitPercent = Math.random() * trade.takeProfit;
    pnl = (trade.entryPrice * profitPercent / 100) * trade.volume;
  } else {
    // Calculate loss based on SL percentage
    const lossPercent = Math.random() * trade.stopLoss;
    pnl = -(trade.entryPrice * lossPercent / 100) * trade.volume;
  }
  
  trade.status = 'closed';
  trade.closePrice = closePrice;
  trade.closeTime = new Date();
  trade.pnl = pnl;
  trade.isWinning = isWinning;
  
  // Update balance
  const balanceKey = trade.account === 'real' ? 'realBalance' : 'demoBalance';
  if (!db.users[req.user.username]) db.users[req.user.username] = {};
  db.users[req.user.username][balanceKey] = (db.users[req.user.username][balanceKey] || 10000) + pnl;
  
  // Add transaction record
  if (!db.transactions) db.transactions = [];
  db.transactions.push({
    id: Date.now().toString(),
    username: req.user.username,
    type: 'trade_close',
    pair: trade.pair,
    pnl: pnl,
    timestamp: new Date()
  });
  
  saveDB(db);
  res.json({ success: true, pnl, closePrice });
});

app.get('/api/trades/history', verifyToken, (req, res) => {
  const { account, limit } = req.query;
  const db = loadDB();
  const trades = (db.trades || [])
    .filter(t => t.username === req.user.username && t.account === (account || 'demo') && t.status === 'closed')
    .sort((a, b) => new Date(b.closeTime) - new Date(a.closeTime))
    .slice(0, parseInt(limit) || 50);
  res.json(trades);
});

// ============================================================================
// MARKET DATA ENDPOINTS
// ============================================================================

app.get('/api/market/price/:symbol', (req, res) => {
  const { symbol } = req.params;
  const market = getMarketPrice(symbol);
  
  if (!market) {
    return res.status(404).json({ error: 'Symbol not found' });
  }
  
  res.json(market);
});

app.get('/api/market/prices', (req, res) => {
  const prices = {};
  Object.keys(MARKET_DATA).forEach(symbol => {
    prices[symbol] = getMarketPrice(symbol);
  });
  res.json(prices);
});

// ============================================================================
// TRANSACTION HISTORY ENDPOINTS
// ============================================================================

app.get('/api/transactions', verifyToken, (req, res) => {
  const { limit } = req.query;
  const db = loadDB();
  const transactions = (db.transactions || [])
    .filter(t => t.username === req.user.username)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, parseInt(limit) || 100);
  res.json(transactions);
});

// ============================================================================
// PAYMENT ENDPOINTS

// M-PESA STK PUSH ENDPOINT
app.post('/api/payment/mpesa-stk', async (req, res) => {
  const { phone, amount, account_id, token, account_reference, transaction_desc, callback_url } = req.body || {};
  const logs = [];
  lastPayheroIntentLogs = logs;
  try {
    logs.push({ step: 'received', body: req.body });
    if (!phone || !amount || !account_id || !token) {
      logs.push({ step: 'validation_failed', error: 'Missing phone, amount, account_id, or token' });
      return res.status(400).json({ error: 'Missing phone, amount, account_id, or token', logs });
    }

    // Normalize phone for M-PESA STK (attempt Kenyan normalization)
    function normalizeMpesaPhone(p) {
      if (!p) return null;
      let s = String(p).trim();
      // remove spaces, dashes, parentheses
      s = s.replace(/[\s\-()]/g, '');
      // remove leading +
      if (s.startsWith('+')) s = s.slice(1);
      // If starts with 0 and length 10 -> assume local Kenyan 07... convert to 2547...
      if (s.length === 10 && s.startsWith('0')) {
        return '254' + s.slice(1);
      }
      // If starts with 7 and length 9 -> assume missing leading 0 -> 2547...
      if (s.length === 9 && s.startsWith('7')) {
        return '254' + s;
      }
      // If already starts with country code like 254 or other, return as-is
      return s;
    }

    const normalizedPhone = normalizeMpesaPhone(phone);
    const currencyForPhone = normalizedPhone && normalizedPhone.startsWith('254') ? 'KES' : 'USD';
    logs.push({ step: 'phone_normalized', original: phone, normalized: normalizedPhone, currency: currencyForPhone });

    // Prepare PayHero STK push payload with extra fields
    const payload = {
      amount: Number(amount),
      currency: 'KES',
      payment_method: 'mpesa_stk',
      description: transaction_desc || `PreoCrypto M-PESA STK Push - ${amount} KES`,
      metadata: {
        user_id: account_id,
        mpesa_phone: normalizedPhone || phone,
        platform: 'preotrader_fx',
        original_amount: amount,
        account_reference: account_reference || 'Deposit',
        transaction_desc: transaction_desc || 'Deposit to my site'
      },
      customer: {
        name: account_id,
        phone: normalizedPhone || phone
      },
      webhook_url: callback_url || PAYHERO_CALLBACK_URL,
      redirect_url: `${SITE_URL}/deposit.html?payment_status=success`
    };
    logs.push({ step: 'payload_prepared', payload });

    // Call PayHero API
    
    const headers = {
      'Content-Type': 'application/json',
      'X-Account-Id': String(PAYHERO_ACCOUNT_ID),
      'X-Request-ID': `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      'X-Timestamp': new Date().toISOString()
    };
    
    // Use Basic Auth if available, otherwise use Bearer token
    if (PAYHERO_BASIC_AUTH) {
      headers['Authorization'] = PAYHERO_BASIC_AUTH.startsWith('Basic ') ? PAYHERO_BASIC_AUTH : `Basic ${PAYHERO_BASIC_AUTH}`;
    } else if (PAYHERO_SECRET_KEY) {
      headers['Authorization'] = `Bearer ${PAYHERO_SECRET_KEY}`;
      headers['X-API-Key'] = PAYHERO_SECRET_KEY;
    }
    
    const response = await fetch('https://backend.payhero.co.ke/api/v2/payments', {
      method: 'POST',
      headers 'X-Timestamp': new Date().toISOString()
      },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    logs.push({ step: 'payhero_response', status: response.status, result });

    if (!response.ok || !result.success) {
      logs.push({ step: 'payhero_error', error: result.error || result.message });
      return res.status(500).json({ error: result.error || result.message || 'PayHero STK push failed', logs });
    }

    // Success: return payment URL (if any) and logs
    return res.json({ success: true, paymentId: result.data?.id, paymentUrl: result.data?.payment_url, logs });
  } catch (err) {
    logs.push({ step: 'exception', error: err.message, stack: err.stack });
    return res.status(500).json({ error: 'Internal server error', logs });
  }
});
// ============================================================================

app.post('/api/payment/deposit', verifyToken, (req, res) => {
  const { amount, method, account } = req.body;
  const db = loadDB();
  // Enforce method-specific minimums
  const m = (method || '').toLowerCase();
  const isCrypto = ['crypto', 'bitcoin', 'btc', 'ethereum', 'eth', 'usdt', 'tron', 'trc20'].includes(m);
  const isMpesa = ['mpesa', 'm-pesa', 'mpesa_stk', 'mpesa-stk'].includes(m);
  const minDeposit = isCrypto ? 25 : (isMpesa ? 10 : 10);
  if (amount < minDeposit) {
    return res.status(400).json({ error: `Minimum deposit is $${minDeposit}` });
  }
  
  // Decide status: instant methods complete, mpesa/crypto pending
  const status = (isMpesa || isCrypto) ? 'pending' : 'completed';
  
  // For completed methods, update balance immediately
  const balanceKey = account === 'real' ? 'realBalance' : 'demoBalance';
  if (!db.users[req.user.username]) db.users[req.user.username] = {};
  if (status === 'completed') {
    db.users[req.user.username][balanceKey] = (db.users[req.user.username][balanceKey] || 10000) + amount;
  }
  
  // Record transaction with local currency conversion
  if (!db.transactions) db.transactions = [];
  const local = convertLocalAmount(db, req.user.username, amount);
  const tx = {
    id: Date.now().toString(),
    username: req.user.username,
    type: 'deposit',
    method,
    amount,
    status,
    account: account || 'real',
    timestamp: new Date()
  };
  if (local) {
    tx.localCurrency = local.currency;
    tx.localAmount = local.amount;
  }
  db.transactions.push(tx);
  
  saveDB(db);
  res.json({ success: true, status, newBalance: db.users[req.user.username][balanceKey] || 0 });
});

app.post('/api/payment/withdrawal', verifyToken, (req, res) => {
  const { amount, method, details, account } = req.body;
  const db = loadDB();
  
  if (amount < 30) {
    return res.status(400).json({ error: 'Minimum withdrawal is $30' });
  }
  
  const balanceKey = account === 'real' ? 'realBalance' : 'demoBalance';
  const currentBalance = db.users[req.user.username]?.[balanceKey] || 10000;
  
  if (amount > currentBalance) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }
  
  // Anti-Money Laundering Check: Real account must reach 30% profit on initial deposit
  let withdrawalStatus = 'pending';
  let amlError = null;
  
  if (account === 'real') {
    const initialDeposit = db.users[req.user.username]?.initialDeposit || 10000;
    const profitRequired = initialDeposit * 0.30; // 30% of initial deposit
    const trades = db.trades?.filter(t => t.username === req.user.username && t.account === 'real') || [];
    const totalProfit = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    
    if (totalProfit < profitRequired) {
      amlError = `AML Rule: Must reach 30% profit ($${profitRequired.toFixed(2)}) before withdrawal on real account. Current profit: $${totalProfit.toFixed(2)}`;
      return res.status(400).json({ error: amlError });
    }
    
    // For real account: only privileged traders get completed status
    const isPrivileged = isPrivilegedTrader(db, req.user.username);
    withdrawalStatus = isPrivileged ? 'completed' : 'pending';
  } else {
    // Demo account: all traders remain pending
    withdrawalStatus = 'pending';
  }
  
  // Deduct from balance
  db.users[req.user.username][balanceKey] = currentBalance - amount;
  
  // Record transaction
  if (!db.transactions) db.transactions = [];
  const localW = convertLocalAmount(db, req.user.username, amount);
  const wtx = {
    id: Date.now().toString(),
    username: req.user.username,
    type: 'withdrawal',
    method,
    amount,
    status: withdrawalStatus,
    account: account,
    details,
    timestamp: new Date()
  };
  if (localW) {
    wtx.localCurrency = localW.currency;
    wtx.localAmount = localW.amount;
  }
  db.transactions.push(wtx);
  
  if (!db.withdrawals) db.withdrawals = [];
  db.withdrawals.push({
    id: Date.now().toString(),
    username: req.user.username,
    amount,
    method,
    account: account,
    details,
    status: withdrawalStatus,
    timestamp: new Date()
  });
  
  saveDB(db);
  const message = isPrivileged ? 'Withdrawal completed' : 'Withdrawal request submitted';
  res.json({ success: true, message, newBalance: db.users[req.user.username][balanceKey], status: withdrawalStatus });
});

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

app.post('/api/admin/credit', verifyToken, (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { username, amount } = req.body;
  const db = loadDB();
  
  if (!db.users[username]) db.users[username] = { username };
  db.users[username].demoBalance = (db.users[username].demoBalance || 10000) + amount;
  
  saveDB(db);
  res.json({ success: true, newBalance: db.users[username].demoBalance });
});

app.get('/api/admin/users', verifyToken, (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const db = loadDB();
  const users = Object.values(db.users).map(u => ({
    username: u.username,
    name: u.name,
    demoBalance: u.demoBalance || 10000,
    realBalance: u.realBalance || 0,
    createdAt: u.createdAt
  }));
  res.json(users);
});

app.get('/api/admin/trades', verifyToken, (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const db = loadDB();
  const trades = (db.trades || []).slice(0, 100);
  res.json(trades);
});

// ============================================================================
// PRIVILEGED USERS MANAGEMENT
// ============================================================================

app.get('/api/privileged-users', (req, res) => {
  const db = loadDB();
  res.json(db.privileged || []);
});

app.post('/api/privileged-users', verifyToken, (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { username } = req.body;
  const db = loadDB();
  
  if (db.privileged.find(p => p.username === username)) {
    return res.status(400).json({ error: 'User already privileged' });
  }
  
  db.privileged.push({ username, createdAt: new Date() });
  saveDB(db);
  res.json({ success: true });
});

// ============================================================================
// WITHDRAWAL MANAGEMENT
// ============================================================================

app.get('/api/admin/withdrawals', verifyToken, (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const db = loadDB();
  const pending = (db.withdrawals || []).filter(w => w.status === 'pending');
  res.json(pending);
});

app.post('/api/admin/withdrawals/:id/approve', verifyToken, (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { id } = req.params;
  const db = loadDB();
  const withdrawal = db.withdrawals.find(w => w.id === id);
  
  if (!withdrawal) {
    return res.status(404).json({ error: 'Withdrawal not found' });
  }
  
  withdrawal.status = 'approved';
  
  if (!db.transactions) db.transactions = [];
  db.transactions.push({
    id: Date.now().toString(),
    username: withdrawal.username,
    type: 'withdrawal_approved',
    amount: withdrawal.amount,
    timestamp: new Date()
  });
  
  saveDB(db);
  res.json({ success: true });
});

// ============================================================================
// PRIVILEGED TRADER MANAGEMENT
// ============================================================================

app.get('/api/admin/privileged-traders', verifyToken, (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const db = loadDB();
  res.json({ privileged: db.privileged || [] });
});

app.post('/api/admin/privileged-traders/add', verifyToken, (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { username } = req.body;
  const db = loadDB();
  
  if (!db.privileged) db.privileged = [];
  if (!db.privileged.includes(username)) {
    db.privileged.push(username);
    saveDB(db);
    res.json({ success: true, message: `${username} is now a privileged trader` });
  } else {
    res.json({ success: false, message: 'Already a privileged trader' });
  }
});

app.post('/api/admin/privileged-traders/remove', verifyToken, (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { username } = req.body;
  const db = loadDB();
  
  if (db.privileged) {
    db.privileged = db.privileged.filter(u => u !== username);
    saveDB(db);
    res.json({ success: true, message: `${username} is no longer a privileged trader` });
  } else {
    res.json({ success: false, message: 'Not found' });
  }
});

// ============================================================================
// HEALTH CHECK & STATS
// ============================================================================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.post('/api/admin/self-test', (req, res) => {
  const db = loadDB();
  const results = {
    timestamp: new Date(),
    dbIntegrity: true,
    usersCount: Object.keys(db.users).length,
    tradesCount: (db.trades || []).length,
    transactionsCount: (db.transactions || []).length,
    pendingWithdrawals: (db.withdrawals || []).filter(w => w.status === 'pending').length,
    activeTokens: (db.tokens || []).filter(t => new Date(t.expiresAt) > new Date()).length
  };
  res.json(results);
});

// ============================================================================
// SERVER START
// ============================================================================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 PreoCrypto API Server running on http://localhost:${PORT}`);
  console.log(`📊 Demo Users: trader1@demo.local (pass123), admin@demo.local (admin123)`);
  console.log(`📁 Database: ${DB_PATH}`);
});

// ============================================================================
// PAYHERO STK PUSH TRIGGER ENDPOINT (Direct STK push)
// ============================================================================

app.post('/webhook/payhero', async (req, res) => {
  // If request has a 'trigger_stk' field, treat as STK push trigger, else treat as webhook callback
  if (req.body && (req.body.trigger_stk === true || req.body.trigger_stk === '1')) {
    // STK push trigger logic (same as /api/payment/mpesa-stk)
    const { phone, amount, account_id, token, account_reference, transaction_desc, callback_url } = req.body || {};
    const logs = [];
    lastPayheroIntentLogs = logs;
    lastPayheroIntentLogs = logs;
    try {
      logs.push({ step: 'received', body: req.body });
      if (!phone || !amount || !account_id || !token) {
        logs.push({ step: 'validation_failed', error: 'Missing phone, amount, account_id, or token' });
        return res.status(400).json({ error: 'Missing phone, amount, account_id, or token', logs });
      }

      // Prepare PayHero STK push payload with extra fields
      const payload = {
        amount: Number(amount),
        currency: 'KES',
        payment_method: 'mpesa_stk',
        description: transaction_desc || `PreoCrypto M-PESA STK Push - ${amount} KES`,
        metadata: {
          user_id: account_id,
          mpesa_phone: phone,
          platform: 'preotrader_fx',
          original_amount: amount,
          account_reference: account_reference || 'Deposit',
          transaction_desc: transaction_desc || 'Deposit to my site'
        },
        customer: {
          name: account_id,
          phone: phone
        },
        webhook_url: callback_url || PAYHERO_CALLBACK_URL,
        redirect_url: `${SITE_URL}/deposit.html?payment_status=success`
      };
      logs.push({ step: 'payload_prepared', payload });

      // Call PayHero API
      const fetch = global.fetch || (await import('node-fetch')).default;
      const response = await fetch('https://backend.payhero.co.ke/api/v2/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PAYHERO_SECRET_KEY}`,
          'X-Account-Id': String(PAYHERO_ACCOUNT_ID),
          'X-API-Key': PAYHERO_SECRET_KEY,
          'X-Request-ID': `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          'X-Timestamp': new Date().toISOString()
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      logs.push({ step: 'payhero_response', status: response.status, result });

      if (!response.ok || !result.success) {
        logs.push({ step: 'payhero_error', error: result.error || result.message });
        return res.status(500).json({ error: result.error || result.message || 'PayHero STK push failed', logs });
      }

      // Success: return payment URL (if any) and logs
      return res.json({ success: true, paymentId: result.data?.id, paymentUrl: result.data?.payment_url, logs });
    } catch (err) {
      logs.push({ step: 'exception', error: err.message, stack: err.stack });
      return res.status(500).json({ error: 'Internal server error', logs });
    }
  } else {
    // Webhook callback handler (original logic)
    const db = loadDB();
    const event = req.body || {};
    const { event_type, data } = event;

    // Optional: verify signature header
    // const sig = req.headers['x-payhero-signature'];
    // TODO: HMAC verification using PAYHERO_SECRET_KEY

    // Find related transaction if any
    const username = data?.metadata?.user_id || data?.metadata?.user_email || null;
    const amountUSD = data?.metadata?.original_amount || data?.amount || 0;
    const method = data?.payment_method || data?.method || 'mpesa';
    const account = (data?.metadata?.account) || 'real';

    // Update transaction status and balance on completion
    if (event_type === 'payment.completed') {
      // Credit balance
      if (!db.users[username]) db.users[username] = { username };
      const balanceKey = account === 'real' ? 'realBalance' : 'demoBalance';
      db.users[username][balanceKey] = (db.users[username][balanceKey] || (balanceKey === 'demoBalance' ? 10000 : 0)) + amountUSD;
      
      // Record completed transaction
      if (!db.transactions) db.transactions = [];
      const local = convertLocalAmount(db, username, amountUSD);
      const tx = {
        id: Date.now().toString(),
        username,
        type: 'deposit',
        method,
        amount: amountUSD,
        status: 'completed',
        account,
        timestamp: new Date(),
        paymentId: data?.id,
        transactionId: data?.transaction_id
      };
      if (local) { tx.localCurrency = local.currency; tx.localAmount = local.amount; }
      db.transactions.push(tx);
    } else if (event_type === 'payment.failed') {
      if (!db.transactions) db.transactions = [];
      db.transactions.push({
        id: Date.now().toString(),
        username,
        type: 'deposit',
        method,
        amount: amountUSD,
        status: 'failed',
        account,
        timestamp: new Date(),
        paymentId: data?.id,
        error: data?.error_message
      });
    } else if (event_type === 'payment.pending') {
      if (!db.transactions) db.transactions = [];
      db.transactions.push({
        id: Date.now().toString(),
        username,
        type: 'deposit',
        method,
        amount: amountUSD,
        status: 'pending',
        account,
        timestamp: new Date(),
        paymentId: data?.id
      });
    }

    saveDB(db);
    res.json({ success: true });
  }
});

  // =============================================================
  // Compatibility endpoints used by front-end (`payments-app.js`)
  // Provide `/api/payhero/stk` and `/api/payhero/create-payment` so
  // the client-side calls succeed and map to same PayHero create API.
  // =============================================================

  app.post('/api/payhero/stk', async (req, res) => {
    const { phone, amount, email, account_id } = req.body || {};
    const logs = [];
    lastPayheroIntentLogs = logs;
    try {
      logs.push({ step: 'received', body: req.body });
      if (!phone || !amount) {
        logs.push({ step: 'validation_failed', error: 'Missing phone or amount' });
        return res.status(400).json({ success: false, error: 'Missing phone or amount', logs });
      }

      function normalizeMpesaPhone(p) {
        if (!p) return null;
        let s = String(p).trim();
        s = s.replace(/[\s\-()]/g, '');
        if (s.startsWith('+')) s = s.slice(1);
        if (s.length === 10 && s.startsWith('0')) return '254' + s.slice(1);
        if (s.length === 9 && s.startsWith('7')) return '254' + s;
        return s;
      }

      const normalizedPhone = normalizeMpesaPhone(phone);
      const currencyForPhone = normalizedPhone && normalizedPhone.startsWith('254') ? 'KES' : 'USD';
      logs.push({ step: 'phone_normalized', original: phone, normalized: normalizedPhone, currency: currencyForPhone });

      const payload = {
        amount: Number(amount),
        currency: 'KES',
        payment_method: 'mpesa_stk',
        description: `PreoCrypto M-PESA STK Push - ${amount} KES`,
        metadata: {
          user_id: account_id || email || 'guest',
          mpesa_phone: normalizedPhone || phone,
          platform: 'preotrader_fx',
          original_amount: amount
        },
        customer: {
          email: email || '',
          name: account_id || email || 'guest',
          phone: normalizedPhone || phone
        },
        webhook_url: PAYHERO_CALLBACK_URL,
        redirect_url: `${SITE_URL}/deposit.html?payment_status=success`
      };
      logs.push({ step: 'payload_prepared', payload });

      const fetch = global.fetch || (await import('node-fetch')).default;
      const response = await fetch('https://backend.payhero.co.ke/api/v2/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PAYHERO_SECRET_KEY}`,
          'X-Account-Id': String(PAYHERO_ACCOUNT_ID),
          'X-API-Key': PAYHERO_SECRET_KEY,
          'X-Request-ID': `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          'X-Timestamp': new Date().toISOString()
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      logs.push({ step: 'payhero_response', status: response.status, result });

      if (!response.ok || !result.success) {
        return res.status(500).json({ success: false, error: result.error || result.message || 'PayHero error', logs });
      }

      return res.json({ success: true, data: result.data, payment_url: result.data?.payment_url, logs });
    } catch (err) {
      logs.push({ step: 'exception', error: err.message, stack: err.stack });
      return res.status(500).json({ success: false, error: 'Internal server error', logs });
    }
  });

  app.post('/api/payhero/create-payment', async (req, res) => {
    const { email, amount, phone } = req.body || {};
    const logs = [];
    lastPayheroIntentLogs = logs;
    try {
      logs.push({ step: 'received', body: req.body });
      if (!amount) return res.status(400).json({ success: false, error: 'Missing amount', logs });

      function normalizeMpesaPhone(p) {
        if (!p) return null;
        let s = String(p).trim();
        s = s.replace(/[\s\-()]/g, '');
        if (s.startsWith('+')) s = s.slice(1);
        if (s.length === 10 && s.startsWith('0')) return '254' + s.slice(1);
        if (s.length === 9 && s.startsWith('7')) return '254' + s;
        return s;
      }

      const normalizedPhone = normalizeMpesaPhone(phone);
      const currencyForPhone = normalizedPhone && normalizedPhone.startsWith('254') ? 'KES' : 'USD';

      const payload = {
        amount: Number(amount),
        currency: 'KES',
        payment_method: 'mpesa_stk',
        description: `PreoCrypto Deposit - ${amount} KES`,
        metadata: {
          user_email: email || 'guest@preotrader.fx',
          original_amount: amount
        },
        customer: {
          email: email || '',
          phone: normalizedPhone || phone || ''
        },
        webhook_url: PAYHERO_CALLBACK_URL,
        redirect_url: `${SITE_URL}/deposit.html?payment_status=success`
      };
      logs.push({ step: 'payload_prepared', payload });

      const fetch = global.fetch || (await import('node-fetch')).default;
      const response = await fetch('https://backend.payhero.co.ke/api/v2/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PAYHERO_SECRET_KEY}`,
          'X-Account-Id': String(PAYHERO_ACCOUNT_ID),
          'X-API-Key': PAYHERO_SECRET_KEY,
          'X-Request-ID': `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          'X-Timestamp': new Date().toISOString()
        },
        body: JSON.stringify(payload)
      });

      // Backwards-compatible payment intent endpoint moved to top-level

// Top-level backwards-compatible payment intent endpoint used by front-end
app.post('/api/payment/intent', async (req, res) => {
  const { amount, currency, phone, metadata = {}, customer = {} } = req.body || {};
  console.log('[/api/payment/intent] incoming:', { amount, phone, metadata });
  const logs = [];
  lastPayheroIntentLogs = logs;
  try {
    logs.push({ step: 'received', body: req.body });
    if (!amount) return res.status(400).json({ success: false, error: 'Missing amount', logs });

    function normalizeMpesaPhone(p) {
      if (!p) return null;
      let s = String(p).trim();
      s = s.replace(/[\s\-()]/g, '');
      if (s.startsWith('+')) s = s.slice(1);
      if (s.length === 10 && s.startsWith('0')) return '254' + s.slice(1);
      if (s.length === 9 && s.startsWith('7')) return '254' + s;
      return s;
    }

    const normalizedPhone = normalizeMpesaPhone(phone || customer.phone || metadata.msisdn);
    const currencyForPhone = 'KES';

    const payload = {
      amount: Number(amount),
      currency: currencyForPhone,
      payment_method: 'mpesa_stk',
      description: `PreoCrypto Deposit - ${amount} ${currencyForPhone}`,
      metadata: Object.assign({}, metadata, { original_amount: amount }),
      customer: Object.assign({}, customer, { phone: normalizedPhone || (customer.phone || '') }),
      webhook_url: PAYHERO_CALLBACK_URL,
      redirect_url: `${SITE_URL}/deposit.html?payment_status=success`
    };
    logs.push({ step: 'payload_prepared', payload });

    const fetch = global.fetch || (await import('node-fetch')).default;
    const response = await fetch('https://backend.payhero.co.ke/api/v2/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PAYHERO_SECRET_KEY}`,
        'X-Account-Id': String(PAYHERO_ACCOUNT_ID),
        'X-API-Key': PAYHERO_SECRET_KEY,
        'X-Request-ID': `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        'X-Timestamp': new Date().toISOString()
      },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    logs.push({ step: 'payhero_response', status: response.status, result });

    if (!response.ok || !result.success) return res.status(500).json({ success: false, error: result.error || result.message || 'PayHero error', logs });
    // Map to front-end expected fields
    return res.json({ success: true, data: result.data, redirect_url: result.data?.payment_url || result.data?.redirect_url, paymentUrl: result.data?.payment_url, logs });
  } catch (err) {
    logs.push({ step: 'exception', error: err.message, stack: err.stack });
    return res.status(500).json({ success: false, error: 'Internal server error', logs });
  }
});

// Debug: return the most recent PayHero intent logs for easy inspection
app.get('/api/debug/payhero-logs', (req, res) => {
  if (!lastPayheroIntentLogs) return res.status(404).json({ success: false, error: 'No logs available yet' });
  res.json({ success: true, logs: lastPayheroIntentLogs });
});

      
      const result = await response.json();
      logs.push({ step: 'payhero_response', status: response.status, result });

      if (!response.ok || !result.success) return res.status(500).json({ success: false, error: result.error || result.message || 'PayHero error', logs });
      return res.json({ success: true, data: result.data, payment_url: result.data?.payment_url, logs });
    } catch (err) {
      logs.push({ step: 'exception', error: err.message, stack: err.stack });
      return res.status(500).json({ success: false, error: 'Internal server error', logs });
    }
  });
