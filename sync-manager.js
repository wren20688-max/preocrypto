// ============================================================================
// SYNC MANAGER - Real-time synchronization across all pages
// ============================================================================

const SyncManager = {
  // Initialize sync for current page
  init: function() {
    // Listen for storage changes from other tabs/windows
    window.addEventListener('storage', () => {
      this.refreshAllData();
    });

    // Listen for custom sync events in same tab
    window.addEventListener('preo-sync', () => {
      this.refreshAllData();
    });

    // Initial load
    this.refreshAllData();
    
    console.log('✓ SyncManager initialized - all data synchronized');
  },

  // Refresh all displayed data
  refreshAllData: function() {
    this.updateBalance();
    this.updatePositions();
    this.updateTransactions();
    this.updateTradeHistory();
  },

  // Update balance display on all elements
  updateBalance: function() {
    const account = window.currentTradingAccount || 'demo';
    const balance = storage.getBalance(account);
    
    // Update all balance displays
    const balanceElements = document.querySelectorAll('#balance, #demoBalance, #realBalance, #tradingAccountBalance');
    balanceElements.forEach(el => {
      if (el) {
        if (el.id === 'demoBalance' && account !== 'demo') return;
        if (el.id === 'realBalance' && account !== 'real') return;
        el.textContent = '$' + balance.toFixed(2);
      }
    });

    // Update in global state if exists
    if (window.globalState) {
      window.globalState.balance = balance;
    }
  },

  // Update positions display
  updatePositions: function() {
    const positions = storage.getPositions();
    const openPositions = positions.filter(p => p.status === 'open');
    
    // Update positions list if function exists
    if (typeof updateOpenPositions === 'function') {
      updateOpenPositions(openPositions);
    }

    // Update position count
    const posCountEl = document.getElementById('openPositionsCount');
    if (posCountEl) {
      posCountEl.textContent = openPositions.length;
    }
  },

  // Update transactions display
  updateTransactions: function() {
    const transactions = storage.getTransactions();
    
    // Update transactions list if function exists
    if (typeof displayTransactions === 'function') {
      displayTransactions(transactions);
    }
  },

  // Update trade history display
  updateTradeHistory: function() {
    const trades = storage.getTrades();
    
    // Update trades list if function exists
    if (typeof displayTradeHistory === 'function') {
      displayTradeHistory(trades);
    }

    // Update recent wins if function exists
    if (typeof updateRecentWinsDisplay === 'function') {
      updateRecentWinsDisplay();
    }
  },

  // Trigger sync event (call this after any data change)
  triggerSync: function() {
    // Dispatch custom event for same-tab sync
    window.dispatchEvent(new Event('preo-sync'));
    
    // Trigger storage event manually if needed
    try {
      localStorage.setItem('preo_last_sync', Date.now().toString());
    } catch(e) {
      console.warn('Could not trigger sync:', e);
    }
  },

  // Execute trade with automatic sync
  executeTrade: function(tradeData) {
    const result = storage.executeTrade(tradeData);
    if (result.success) {
      this.triggerSync();
    }
    return result;
  },

  // Close position with automatic sync
  closePosition: function(positionId, closePrice) {
    const result = storage.closePosition(positionId, closePrice);
    if (result.success) {
      this.triggerSync();
    }
    return result;
  },

  // Add deposit with automatic sync
  addDeposit: function(amount, method, account) {
    const result = storage.addDeposit(amount, method, account);
    if (result.success) {
      this.triggerSync();
    }
    return result;
  },

  // Add withdrawal with automatic sync
  addWithdrawal: function(amount, method, account) {
    const result = storage.addWithdrawal(amount, method, account);
    if (result.success) {
      this.triggerSync();
    }
    return result;
  }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => SyncManager.init());
} else {
  SyncManager.init();
}
