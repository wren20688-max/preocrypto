// Supabase database helper for Netlify functions
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;

function getSupabase() {
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase not configured, using in-memory fallback');
    return null;
  }
  if (!supabase) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

// In-memory fallback when Supabase is not configured
let memoryDB = { 
  users: {}, 
  tokens: [], 
  transactions: [],
  trades: [],
  deposits: [],
  withdrawals: []
};

// ===== USER OPERATIONS =====

async function getUser(username) {
  const db = getSupabase();
  if (!db) {
    return memoryDB.users[username] || null;
  }
  
  const { data, error } = await db
    .from('users')
    .select('*')
    .eq('username', username)
    .single();
  
  return error ? null : data;
}

async function getUserByEmail(email) {
  const db = getSupabase();
  if (!db) {
    return Object.values(memoryDB.users).find(u => u.email?.toLowerCase() === email.toLowerCase()) || null;
  }
  
  const { data, error } = await db
    .from('users')
    .select('*')
    .ilike('email', email)
    .single();
  
  return error ? null : data;
}

async function createUser(userData) {
  const db = getSupabase();
  if (!db) {
    memoryDB.users[userData.username] = userData;
    return userData;
  }
  
  const { data, error } = await db
    .from('users')
    .insert([userData])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

async function updateUserBalance(username, balanceType, newBalance) {
  const db = getSupabase();
  if (!db) {
    if (memoryDB.users[username]) {
      if (balanceType === 'demo') {
        memoryDB.users[username].demo_balance = newBalance;
      } else {
        memoryDB.users[username].real_balance = newBalance;
      }
      return memoryDB.users[username];
    }
    return null;
  }
  
  const field = balanceType === 'demo' ? 'demo_balance' : 'real_balance';
  const { data, error } = await db
    .from('users')
    .update({ [field]: newBalance })
    .eq('username', username)
    .select()
    .single();
  
  return error ? null : data;
}

async function getAllUsers() {
  const db = getSupabase();
  if (!db) {
    return Object.values(memoryDB.users);
  }
  
  const { data, error } = await db
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
  
  return error ? [] : data;
}

// ===== TOKEN OPERATIONS =====

async function saveToken(tokenData) {
  const db = getSupabase();
  if (!db) {
    memoryDB.tokens.push(tokenData);
    return tokenData;
  }
  
  const { data, error } = await db
    .from('tokens')
    .insert([tokenData])
    .select()
    .single();
  
  return error ? null : data;
}

async function verifyToken(token) {
  const db = getSupabase();
  if (!db) {
    return memoryDB.tokens.find(t => t.token === token) || null;
  }
  
  const { data, error } = await db
    .from('tokens')
    .select('*')
    .eq('token', token)
    .gte('expires_at', new Date().toISOString())
    .single();
  
  return error ? null : data;
}

// ===== TRANSACTION OPERATIONS =====

async function createTransaction(transactionData) {
  const db = getSupabase();
  if (!db) {
    const txn = { ...transactionData, id: Date.now() };
    memoryDB.transactions.push(txn);
    return txn;
  }
  
  const { data, error } = await db
    .from('transactions')
    .insert([transactionData])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

async function getTransactions(username, limit = 100) {
  const db = getSupabase();
  if (!db) {
    return memoryDB.transactions
      .filter(t => t.username === username)
      .slice(0, limit);
  }
  
  const { data, error } = await db
    .from('transactions')
    .select('*')
    .eq('username', username)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  return error ? [] : data;
}

// ===== TRADE OPERATIONS =====

async function createTrade(tradeData) {
  const db = getSupabase();
  if (!db) {
    const trade = { ...tradeData, id: Date.now() };
    memoryDB.trades.push(trade);
    return trade;
  }
  
  const { data, error } = await db
    .from('trades')
    .insert([tradeData])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

async function updateTrade(tradeId, updateData) {
  const db = getSupabase();
  if (!db) {
    const trade = memoryDB.trades.find(t => t.id === tradeId);
    if (trade) {
      Object.assign(trade, updateData);
      return trade;
    }
    return null;
  }
  
  const { data, error } = await db
    .from('trades')
    .update(updateData)
    .eq('id', tradeId)
    .select()
    .single();
  
  return error ? null : data;
}

async function getTrades(username, status = null) {
  const db = getSupabase();
  if (!db) {
    let trades = memoryDB.trades.filter(t => t.username === username);
    if (status) {
      trades = trades.filter(t => t.status === status);
    }
    return trades;
  }
  
  let query = db
    .from('trades')
    .select('*')
    .eq('username', username)
    .order('opened_at', { ascending: false });
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query;
  return error ? [] : data;
}

// ===== DEPOSIT OPERATIONS =====

async function createDeposit(depositData) {
  const db = getSupabase();
  if (!db) {
    const deposit = { ...depositData, id: Date.now() };
    memoryDB.deposits.push(deposit);
    return deposit;
  }
  
  const { data, error } = await db
    .from('deposits')
    .insert([depositData])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

async function updateDeposit(depositId, updateData) {
  const db = getSupabase();
  if (!db) {
    const deposit = memoryDB.deposits.find(d => d.id === depositId);
    if (deposit) {
      Object.assign(deposit, updateData);
      return deposit;
    }
    return null;
  }
  
  const { data, error } = await db
    .from('deposits')
    .update(updateData)
    .eq('id', depositId)
    .select()
    .single();
  
  return error ? null : data;
}

async function getDepositByReference(reference) {
  const db = getSupabase();
  if (!db) {
    return memoryDB.deposits.find(d => d.payment_reference === reference) || null;
  }
  
  const { data, error } = await db
    .from('deposits')
    .select('*')
    .eq('payment_reference', reference)
    .single();
  
  return error ? null : data;
}

// ===== WITHDRAWAL OPERATIONS =====

async function createWithdrawal(withdrawalData) {
  const db = getSupabase();
  if (!db) {
    const withdrawal = { ...withdrawalData, id: Date.now() };
    memoryDB.withdrawals.push(withdrawal);
    return withdrawal;
  }
  
  const { data, error } = await db
    .from('withdrawals')
    .insert([withdrawalData])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

async function getWithdrawals(username = null, status = null) {
  const db = getSupabase();
  if (!db) {
    let withdrawals = memoryDB.withdrawals;
    if (username) {
      withdrawals = withdrawals.filter(w => w.username === username);
    }
    if (status) {
      withdrawals = withdrawals.filter(w => w.status === status);
    }
    return withdrawals;
  }
  
  let query = db.from('withdrawals').select('*').order('created_at', { ascending: false });
  
  if (username) {
    query = query.eq('username', username);
  }
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query;
  return error ? [] : data;
}

module.exports = {
  getSupabase,
  getUser,
  getUserByEmail,
  createUser,
  updateUserBalance,
  getAllUsers,
  saveToken,
  verifyToken,
  createTransaction,
  getTransactions,
  createTrade,
  updateTrade,
  getTrades,
  createDeposit,
  updateDeposit,
  getDepositByReference,
  createWithdrawal,
  getWithdrawals
};
