// ============================================================================
// STORAGE MODULE - Session & User Data Management
// ============================================================================

const storage = {
  // User session management
  getUser: function() {
    // Check preo_user first (current session)
    let user = localStorage.getItem('preo_user');
    if (user) {
      return JSON.parse(user);
    }
    // Do not auto-restore sessions from stored users. Require explicit login/register.
    return null;
  },

  setUser: function(user) {
    localStorage.setItem('preo_user', JSON.stringify(user));
    localStorage.setItem('preo_last_login', user.email);
  },

  removeUser: function() {
    localStorage.removeItem('preo_user');
    localStorage.removeItem('preo_token');
    localStorage.removeItem('preo_saved_email');
    localStorage.removeItem('preo_remember_me');
    localStorage.removeItem('preo_saved_password');
  },

  isLoggedIn: function() {
    // Require both a user object and a token to consider the session authenticated
    return !!(this.getUser() && this.getToken());
  },

  // Token management
  getToken: function() {
    return localStorage.getItem('preo_token');
  },

  setToken: function(token) {
    localStorage.setItem('preo_token', token);
  },

  // Balance management
  getBalance: function(account = 'demo') {
    const key = `balance_${account}`;
    const defaultBalance = account === 'real' ? '0' : '10000';
    return parseFloat(localStorage.getItem(key) || defaultBalance);
  },

  setBalance: function(amount, account = 'demo') {
    const key = `balance_${account}`;
    localStorage.setItem(key, amount.toString());
  },

  // Trade history
  getTrades: function() {
    const trades = localStorage.getItem('preo_trades');
    return trades ? JSON.parse(trades) : [];
  },

  addTrade: function(trade) {
    if (!this.isLoggedIn()) {
      console.warn('Attempted to save trade while not authenticated; ignoring.');
      return false;
    }
    const trades = this.getTrades();
    trades.unshift(trade);
    localStorage.setItem('preo_trades', JSON.stringify(trades.slice(0, 100))); // Keep last 100
    return true;
  },

  // Positions
  getPositions: function() {
    const positions = localStorage.getItem('preo_positions');
    return positions ? JSON.parse(positions) : [];
  },

  setPositions: function(positions) {
    localStorage.setItem('preo_positions', JSON.stringify(positions));
  },

  // Transactions
  getTransactions: function() {
    const transactions = localStorage.getItem('preo_transactions');
    return transactions ? JSON.parse(transactions) : [];
  },

  addTransaction: function(transaction) {
    if (!this.isLoggedIn()) {
      console.warn('Attempted to save transaction while not authenticated; ignoring.');
      return false;
    }
    const transactions = this.getTransactions();
    transactions.unshift(transaction);
    localStorage.setItem('preo_transactions', JSON.stringify(transactions.slice(0, 200)));
    return true;
  },

  // Clear all data (logout)
  clearAll: function() {
    const keys = ['preo_user', 'preo_token', 'preo_trades', 'preo_positions', 'preo_transactions'];
    keys.forEach(key => localStorage.removeItem(key));
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
