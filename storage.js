// Migrate all localStorage users to Supabase if not already present
storage.migrateLocalUsersToSupabase = async function() {
  try {
    const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
    for (const user of localUsers) {
      const supaUser = await storage.getUser(user.email || user.username);
      if (!supaUser) {
        await storage.setUser(user);
      }
    }
  } catch (e) {
    // ignore
  }
};
// ============================================================================
// STORAGE MODULE - Session & User Data Management
// ============================================================================

const API_URL = '/.netlify/functions/user-data';
const storage = {
  // User session management
  getUser: async function(username) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'getUser', payload: { username } })
    });
    const data = await res.json();
    return data.result || null;
  },

  setUser: async function(user) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'createUser', payload: { userData: user } })
    });
    return (await res.json()).result;
  },

  removeUser: function() {
    // No-op for Supabase, handle logout by clearing token client-side
  },

  isLoggedIn: function() {
    // Should check token validity with backend in production
    return !!this.getToken();
  },

  // Token management
  getToken: function() {
    return localStorage.getItem('preo_token');
  },
  setToken: function(token) {
    localStorage.setItem('preo_token', token);
  },

  // Balance management
  getBalance: async function(username, account = 'demo') {
    const user = await this.getUser(username);
    return account === 'real' ? user?.real_balance || 0 : user?.demo_balance || 10000;
  },
  setBalance: async function(username, amount, account = 'demo') {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateUserBalance', payload: { username, balanceType: account, newBalance: amount } })
    });
    return (await res.json()).result;
  },

  // Trade history
  getTrades: async function(username, status = null) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'getTrades', payload: { username, status } })
    });
    return (await res.json()).result || [];
  },
  addTrade: async function(trade) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'createTrade', payload: { tradeData: trade } })
    });
    return (await res.json()).result;
  },

  // Positions
  // Positions: store as trades with status 'open' or 'closed'
  getPositions: async function(username) {
    const trades = await this.getTrades(username, 'open');
    return trades;
  },
  setPositions: async function(username, positions) {
    // Not needed, handled by addTrade/updateTrade
    return true;
  },

  // Transactions
  getTransactions: async function(username, limit = 100) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'getTransactions', payload: { username, limit } })
    });
    return (await res.json()).result || [];
  },
  addTransaction: async function(transaction) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'createTransaction', payload: { transactionData: transaction } })
    });
    return (await res.json()).result;
  },

  // Clear all data (logout)
  clearAll: function() {
    // No-op for Supabase, handle logout by clearing token client-side
  },

  // =========================================================================
  // UNIFIED TRADING OPERATIONS - Used by all pages
  // =========================================================================

  // Execute a trade (opens a new position)
  executeTrade: function(tradeData) {
    if (!this.isLoggedIn()) {
      return { success: false, message: 'Not authenticated' };
    }

    const { pair, type, amount, entryPrice, stopLoss, takeProfit, account = 'demo' } = tradeData;
    
    // Check balance
    const balance = this.getBalance(account);
    if (balance < amount) {
      return { success: false, message: 'Insufficient balance' };
    }

    // Create position
    const position = {
      id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      pair: pair,
      type: type, // 'buy' or 'sell'
      amount: parseFloat(amount),
      entryPrice: parseFloat(entryPrice),
      currentPrice: parseFloat(entryPrice),
      stopLoss: stopLoss ? parseFloat(stopLoss) : null,
      takeProfit: takeProfit ? parseFloat(takeProfit) : null,
      openTime: new Date().toISOString(),
      account: account,
      status: 'open',
      profit: 0
    };

    // Add to positions
    const positions = this.getPositions();
    positions.push(position);
    this.setPositions(positions);

    // Create transaction record
    const transaction = {
      id: position.id,
      type: 'trade_open',
      pair: pair,
      tradeType: type,
      amount: amount,
      price: entryPrice,
      timestamp: new Date().toISOString(),
      account: account,
      status: 'completed'
    };
    this.addTransaction(transaction);

    // Broadcast storage change event to sync all open pages
    window.dispatchEvent(new Event('storage'));
    
    return { success: true, position: position };
  },

  // Close a position
  closePosition: function(positionId, closePrice) {
    if (!this.isLoggedIn()) {
      return { success: false, message: 'Not authenticated' };
    }

    const positions = this.getPositions();
    const posIndex = positions.findIndex(p => p.id === positionId);
    
    if (posIndex === -1) {
      return { success: false, message: 'Position not found' };
    }

    const position = positions[posIndex];
    
    // Calculate profit/loss
    let priceDiff;
    if (position.type === 'buy') {
      priceDiff = closePrice - position.entryPrice;
    } else {
      priceDiff = position.entryPrice - closePrice;
    }
    
    const profit = (priceDiff / position.entryPrice) * position.amount;
    
    // Update balance
    const newBalance = this.getBalance(position.account) + position.amount + profit;
    this.setBalance(newBalance, position.account);

    // Mark position as closed
    position.status = 'closed';
    position.closePrice = closePrice;
    position.closeTime = new Date().toISOString();
    position.profit = profit;

    // Update positions
    positions[posIndex] = position;
    this.setPositions(positions);

    // Add to trade history
    const trade = {
      id: position.id,
      pair: position.pair,
      type: position.type,
      amount: position.amount,
      entryPrice: position.entryPrice,
      closePrice: closePrice,
      profit: profit,
      openTime: position.openTime,
      closeTime: position.closeTime,
      account: position.account,
      result: profit >= 0 ? 'win' : 'loss'
    };
    this.addTrade(trade);

    // Create transaction record
    const transaction = {
      id: position.id + '_close',
      type: 'trade_close',
      pair: position.pair,
      tradeType: position.type,
      amount: position.amount,
      entryPrice: position.entryPrice,
      closePrice: closePrice,
      profit: profit,
      timestamp: new Date().toISOString(),
      account: position.account,
      status: 'completed'
    };
    this.addTransaction(transaction);

    // Broadcast storage change event
    window.dispatchEvent(new Event('storage'));

    return { success: true, profit: profit, position: position };
  },

  // Update position prices (for displaying current P&L)
  updatePositionPrices: function(priceUpdates) {
    const positions = this.getPositions();
    let updated = false;

    positions.forEach(pos => {
      if (pos.status === 'open' && priceUpdates[pos.pair]) {
        pos.currentPrice = priceUpdates[pos.pair];
        
        // Calculate current profit
        let priceDiff;
        if (pos.type === 'buy') {
          priceDiff = pos.currentPrice - pos.entryPrice;
        } else {
          priceDiff = pos.entryPrice - pos.currentPrice;
        }
        pos.profit = (priceDiff / pos.entryPrice) * pos.amount;
        
        updated = true;
      }
    });

    if (updated) {
      this.setPositions(positions);
    }
  },

  // Get wins/losses summary
  getWinsSummary: function() {
    const trades = this.getTrades();
    const wins = trades.filter(t => t.result === 'win');
    const losses = trades.filter(t => t.result === 'loss');
    
    const totalProfit = trades.reduce((sum, t) => sum + (t.profit || 0), 0);
    const winRate = trades.length > 0 ? (wins.length / trades.length * 100).toFixed(1) : '0';
    
    return {
      totalTrades: trades.length,
      wins: wins.length,
      losses: losses.length,
      totalProfit: totalProfit,
      winRate: winRate,
      recentWins: wins.slice(0, 5)
    };
  },

  // Add deposit
  addDeposit: function(amount, method, account = 'demo') {
    if (!this.isLoggedIn()) {
      return { success: false, message: 'Not authenticated' };
    }

    const currentBalance = this.getBalance(account);
    const newBalance = currentBalance + parseFloat(amount);
    this.setBalance(newBalance, account);

    const transaction = {
      id: Date.now() + '_deposit',
      type: 'deposit',
      amount: parseFloat(amount),
      method: method,
      timestamp: new Date().toISOString(),
      account: account,
      status: 'completed',
      balanceBefore: currentBalance,
      balanceAfter: newBalance
    };
    this.addTransaction(transaction);

    window.dispatchEvent(new Event('storage'));
    
    return { success: true, newBalance: newBalance };
  },

  // Add withdrawal
  addWithdrawal: function(amount, method, account = 'demo') {
    if (!this.isLoggedIn()) {
      return { success: false, message: 'Not authenticated' };
    }

    const currentBalance = this.getBalance(account);
    if (currentBalance < amount) {
      return { success: false, message: 'Insufficient balance' };
    }

    const newBalance = currentBalance - parseFloat(amount);
    this.setBalance(newBalance, account);

    const transaction = {
      id: Date.now() + '_withdrawal',
      type: 'withdrawal',
      amount: parseFloat(amount),
      method: method,
      timestamp: new Date().toISOString(),
      account: account,
      status: 'pending',
      balanceBefore: currentBalance,
      balanceAfter: newBalance
    };
    this.addTransaction(transaction);

    window.dispatchEvent(new Event('storage'));
    
    return { success: true, newBalance: newBalance };
  }
};
