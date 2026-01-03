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
  }
};
