# 🧪 Testing Guide - Auto Trading & Features

## Quick Test (5 minutes)

### 1. Test Dark/Light Mode Toggle
```
1. Open dashboard.html
2. Click 🌙 Theme button (top right)
3. Page should switch to light mode
4. Click again → should switch to dark mode
5. Reload page → theme should persist
✅ PASS: Theme switches and persists
```

### 2. Test Demo/Real Account Switching (Dashboard)
```
1. On dashboard.html, find Demo/Real buttons (near chart)
2. Click 💎 Real Account button
3. Button should highlight in gold
4. Page reloads and shows real balance
5. Click 📱 Demo Account button
6. Button highlights in cyan
7. Page reloads showing demo balance ($10,000)
✅ PASS: Account switching works
```

### 3. Test Demo/Real Account Switching (Auto Trading)
```
1. Go to auto-trading.html
2. Find two buttons at top: 📱 Demo Account & 💎 Real Account
3. Click 💎 Real Account
4. Button styling changes (gold highlight)
5. Balance displays real account balance
6. Click 📱 Demo Account
7. Button styling changes (cyan)
8. Balance shows $10,000 demo balance
✅ PASS: Auto trading account switcher works
```

### 4. Test Auto Trading Bot Start/Stop
```
1. Stay on auto-trading.html
2. Select trading pair: EUR/USD
3. Select strategy: Moving Average
4. Set volume: 0.2
5. Set max trades: 5
6. Check Status shows: "Stopped 🔴"
7. Click ▶️ Start Bot
8. Status should change to: "Running 🟢"
9. Start button should become grayed out
10. Stop button should become red/active
11. Activity log should show trade initiation messages
12. Check Performance Statistics updating
13. Click ⏹️ Stop Bot
14. Status should change to "Stopped 🔴"
15. Buttons return to normal state
16. Check trades are recorded in log
✅ PASS: Bot starts, runs, and stops properly
```

### 5. Test Bot Reset
```
1. After stopping bot (from test 4)
2. Check that statistics show: X trades, Y wins, Z losses
3. Click 🔄 Reset
4. Statistics should reset to: 0 trades, 0 wins, 0 losses
5. Activity log should show "Bot reset" message
✅ PASS: Reset clears all statistics
```

---

## Advanced Testing (10 minutes)

### Test 6: Bot Configuration
```
1. Set different values:
   - Pair: GBP/USD
   - Strategy: RSI Crossover
   - Volume: 0.5
   - Max Trades: 20
   - Take Profit: 3%
   - Stop Loss: 2%
2. Start bot
3. Check log shows correct configuration
4. Verify log matches your settings
✅ PASS: Configuration applies correctly
```

### Test 7: Balance Updates
```
1. Start bot in DEMO account
2. Watch balance in "Trading Account Balance" box
3. After 1-2 trades, balance should increase/decrease
4. Switch to REAL account (if user has deposits)
5. Balance should show real account balance
6. Start bot in real account
7. Check if balance updates with trades
✅ PASS: Balance updates with trades
```

### Test 8: Cross-Page Sync
```
1. Open dashboard.html
2. Switch to Real account
3. Go to auto-trading.html
4. Check if Real account is still selected
5. Go back to dashboard
6. Should still be on Real account
✅ PASS: Account selection syncs across pages
```

### Test 9: Theme Persistence Across Pages
```
1. Open dashboard.html
2. Switch to light mode
3. Go to auto-trading.html
4. Should be in light mode
5. Go to finances.html
6. Should still be in light mode
7. Reload page
8. Should still be in light mode
✅ PASS: Theme persists everywhere
```

### Test 10: Activity Log Scrolling
```
1. Start bot with low interval (2-3 seconds between trades)
2. Let it run for 30 seconds
3. Check that activity log shows many entries
4. Verify timestamps are visible
5. Scroll through log to see all messages
6. Check for: Buy/Sell signals, P&L, status changes
✅ PASS: Activity log captures everything
```

---

## Error Cases (Testing edge cases)

### Test 11: Insufficient Balance (Real Account)
```
1. Ensure real account has $0 balance
2. Click Start Bot
3. Try to execute a trade
4. Should show: "Insufficient balance" message (or skip trade)
✅ PASS: Handles low balance gracefully
```

### Test 12: Maximum Trades Limit
```
1. Set Max Daily Trades: 3
2. Start bot
3. Bot should execute ~3 trades then stop
4. Activity log should show: "Maximum daily trades reached"
✅ PASS: Respects trade limit
```

### Test 13: Stop During Active Trade
```
1. Start bot
2. Wait for 1-2 trades to execute
3. Immediately click Stop Bot
4. Bot should stop within 2 seconds
5. Current trade should complete, then stop
✅ PASS: Graceful shutdown
```

---

## Browser Console Checks

Open Developer Tools (F12) → Console tab:

```javascript
// Check current trading account
console.log(window.currentTradingAccount) // Should show: 'demo' or 'real'

// Check theme
console.log(localStorage.getItem('theme')) // Should show: 'dark' or 'light'

// Check if bot is running
console.log(botRunning) // Should show: true or false

// Check bot stats
console.log(botStats) // Should show: {trades: X, wins: Y, losses: Z, pnl: $}

// Check balance
console.log(document.getElementById('balance').textContent) // Shows balance
```

---

## Performance Tests

### Test 14: Memory Usage
```
1. Open dashboard.html
2. Open DevTools → Memory tab
3. Take heap snapshot (baseline)
4. Run bot for 10 minutes (100+ trades)
5. Take another heap snapshot
6. Compare: Should not grow > 50MB
✅ PASS: No memory leaks
```

### Test 15: CPU Usage
```
1. Run bot with 5-second intervals
2. Check DevTools → Performance tab
3. CPU usage should be < 5% average
4. No long tasks (> 50ms)
✅ PASS: Efficient processing
```

---

## Deployment Readiness Checklist

- [ ] Theme toggle working on all pages
- [ ] Demo/Real account switching on dashboard
- [ ] Demo/Real account switching on auto-trading
- [ ] Bot starts and stops correctly
- [ ] Activity log records all actions
- [ ] Balance updates with trades
- [ ] Statistics track correctly
- [ ] Reset clears statistics
- [ ] Preferences persist across page reloads
- [ ] Account setting syncs across pages
- [ ] No console errors
- [ ] Mobile responsive (test on phone)
- [ ] Touch buttons work on mobile
- [ ] Performance is good (< 5% CPU)

---

## Rollback Plan

If anything breaks:
1. Open auto-trading.html in editor
2. Remove the new event listeners
3. Clear localStorage: `localStorage.clear()`
4. Reload page

---

## Success Metrics

✅ All 15 tests pass  
✅ No console errors  
✅ Theme persists  
✅ Account switches smoothly  
✅ Bot runs without crashing  
✅ Balance updates correctly  
✅ Performance is acceptable  

**Ready for production!** 🚀

