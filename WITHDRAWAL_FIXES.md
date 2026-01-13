# Withdrawal System Fixes - Implementation Guide

## Summary
Fixed three critical withdrawal issues:
1. ✅ **Withdrawal Status Messages** - Shows "pending" for normal users and "completed" for marketers
2. ✅ **30% Profit Requirement** - Prevents real account withdrawals until 30% profit is achieved  
3. ✅ **Local Currency Conversion** - Displays withdrawal amount in user's local currency (KES, NGN, ZAR, etc.)

## Changes Made

### 1. Netlify Function: custom-withdrawal.js
**File:** `netlify/functions/custom-withdrawal.js`

**What was added:**
- Currency conversion rates for African countries (Kenya, Nigeria, South Africa, Ghana, Uganda, Tanzania)
- 30% profit validation check for normal users on real account
- Local currency calculation and display
- Proper status messages ("pending" vs "completed")
- Separate handling for marketers (auto-completed)

**Key Features:**
```javascript
// Forex rates for withdrawals
const FOREX_RATES = {
  'KE': { code: 'KES', rate: 130 },      // Kenya
  'NG': { code: 'NGN', rate: 1500 },     // Nigeria
  'ZA': { code: 'ZAR', rate: 18.5 },     // South Africa
  'GH': { code: 'GHS', rate: 14.0 },     // Ghana
  'UG': { code: 'UGX', rate: 3800 },     // Uganda
  'TZ': { code: 'TZS', rate: 2500 },     // Tanzania
  'US': { code: 'USD', rate: 1 }         // USA
};

// 30% profit check - blocks withdrawal if not met
if (account === 'real' && user.role !== 'marketer') {
  const totalProfit = realTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
  const profitRequired = initialDeposit * 0.30;  // 30% of initial deposit
  
  if (totalProfit < profitRequired) {
    return { statusCode: 400, error: 'Must reach 30% profit before withdrawal' }
  }
}

// Marketer status (auto-complete)
status = user.role === 'marketer' ? 'completed' : 'pending';
```

### 2. finances.html UI Updates
**File:** `finances.html` (lines 90-110)

**HTML Changes:**
```html
<!-- Added profit requirement warning -->
<div id="profitWarning" style="display: none; ...">
  <strong>⚠️ Requirement:</strong> 
  <span id="profitText">You need $X more profit</span>
</div>

<!-- Added local currency display -->
<div id="localCurrencyDisplay">
  You will receive: KES 13,000
</div>
```

### 3. finances.html JavaScript Updates
**File:** `finances.html` (processWithdraw function)

**JavaScript Changes:**
```javascript
async function processWithdraw() {
  // Now passes account type
  const account = currentAccount || 'demo';
  
  const response = await fetch('/api/custom-withdrawal', {
    body: JSON.stringify({ 
      username: user.username,
      amount, 
      method: 'mpesa',
      account: account,     // NEW: pass account type
      phone_number: user.phone
    })
  });
  
  // Display proper status messages
  const msg = status === 'completed' 
    ? '✅ Withdrawal completed!\n$' + amount + ' USD (' + localAmount + ')'
    : '⏳ Withdrawal pending approval\n$' + amount + ' USD (' + localAmount + ')';
}

// Real-time currency conversion as user types
document.getElementById('withdrawAmount').addEventListener('input', (e) => {
  const usdAmount = parseFloat(e.target.value);
  const forex = forexRates[userCountry]; // e.g., KES: 130
  const localAmount = usdAmount * forex.rate;
  document.getElementById('localCurrencyDisplay').textContent 
    = forex.code + ' ' + localAmount.toLocaleString();
});
```

---

## User Experience Flow

### For Normal Users on Real Account
1. User navigates to Finances → Quick Withdraw
2. If they don't have 30% profit:
   - Yellow warning shows: "⚠️ You need $X more profit to withdraw"
   - Withdraw button is disabled (grayed out)
   - They cannot proceed
3. Once they reach 30% profit:
   - Warning disappears
   - Button becomes enabled
   - They can withdraw
4. After submitting withdrawal:
   - Shows: "⏳ Withdrawal pending approval - $100 USD (KES 13,000)"
   - Admin must approve the withdrawal

### For Marketers
1. User withdraws from real account (no profit requirement)
2. Button is always enabled
3. After submitting:
   - Shows: "✅ Withdrawal completed! - $100 USD (KES 13,000)"
   - Funds are immediately processed

### For Demo Account (All Users)
1. No profit requirement
2. Amount always converts to local currency
3. Shows: "⏳ Withdrawal pending approval"
4. Demo withdrawals treated as practice (not real money)

---

## Testing Checklist

### Test 1: 30% Profit Requirement (Normal User)
- [ ] Normal user with $0 profit on real account
- [ ] Visit Finances → Quick Withdraw
- [ ] Yellow warning appears
- [ ] Button says "Request Withdrawal" (grayed out)
- [ ] Try to click - nothing happens
- [ ] Verify message shows how much more profit needed

### Test 2: Currency Conversion
- [ ] User from Kenya inputs $100
- [ ] Display shows "KES 13,000" (100 × 130)
- [ ] User from Nigeria inputs $50  
- [ ] Display shows "NGN 75,000" (50 × 1500)
- [ ] User from USA inputs $75
- [ ] Display shows "USD 75" (no conversion)

### Test 3: Marketer Withdrawal
- [ ] Marketer user on real account
- [ ] No profit requirement warning
- [ ] Submit withdrawal
- [ ] Shows "✅ Withdrawal completed!"
- [ ] Balance immediately reduced

### Test 4: Normal User After 30% Profit
- [ ] User with $300 initial deposit = $90 profit required
- [ ] User has $90 in profits
- [ ] Visit withdraw page
- [ ] Warning disappears
- [ ] Button enabled
- [ ] Can withdraw successfully
- [ ] Shows "⏳ Pending approval"

### Test 5: Demo Account Withdrawal
- [ ] Any user on demo account
- [ ] No profit requirement shown
- [ ] Currency converts correctly
- [ ] Shows "⏳ Pending approval"

---

## Database Schema

The withdrawals table now stores:
```sql
CREATE TABLE withdrawals (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  phone_number TEXT,
  payment_method TEXT,
  status TEXT,                    -- 'pending' or 'completed'
  account TEXT,                   -- 'real' or 'demo'
  local_currency TEXT,            -- e.g., 'KES'
  local_amount DECIMAL(15,2),     -- Amount in local currency
  requested_at TIMESTAMP,
  created_at TIMESTAMP,
  metadata JSONB                  -- Stores profit_warning, country, exchange_rate
);
```

---

## API Response Examples

### Success: Normal User
```json
{
  "result": {
    "status": "pending",
    "message": "⏳ Withdrawal pending approval",
    "localAmount": "KES 13,000",
    "amount": 100,
    "profit_warning": null
  }
}
```

### Success: Marketer
```json
{
  "result": {
    "status": "completed",
    "message": "✅ Withdrawal completed",
    "localAmount": "KES 13,000",
    "amount": 100
  }
}
```

### Error: 30% Profit Not Met
```json
{
  "error": "⚠️ 30% Profit Requirement Not Met",
  "details": "You need $45.00 more profit to withdraw. Current profit: $45.00, Required: $90.00"
}
```

---

## Environment & Configuration

**Currency Rates (USD to Local):**
- Kenya (KE): 1 USD = 130 KES
- Nigeria (NG): 1 USD = 1,500 NGN
- South Africa (ZA): 1 USD = 18.5 ZAR
- Ghana (GH): 1 USD = 14 GHS
- Uganda (UG): 1 USD = 3,800 UGX
- Tanzania (TZ): 1 USD = 2,500 TZS
- USA (US): 1 USD = 1 USD

**30% Profit Rule:**
- Applies only to real account withdrawals
- Applies only to normal users (not marketers)
- Based on actual trades: (sum of profit_loss from all trades) / (initial_deposit)
- Blocks withdrawal if: profit < (initial_deposit × 0.30)

---

## Next Steps

1. ✅ Deploy updated `custom-withdrawal.js` to Netlify
2. ✅ Update `finances.html` with new UI and JavaScript
3. ✅ Verify Supabase schema has correct withdrawal table structure
4. Test all scenarios in the checklist above
5. Monitor admin approvals for pending withdrawals
6. Adjust forex rates if they change significantly

---

## Known Limitations

- Forex rates are hardcoded (daily updates not automated)
- Demo withdrawals don't actually process (simulated only)
- 30% profit check uses initial_deposit field (must be set when user creates account)
- No email notifications for withdrawal requests (admin must check manually)

---

## Files Modified

1. `netlify/functions/custom-withdrawal.js` - Enhanced with profit check and forex
2. `finances.html` - Added UI for warnings and currency display + JS logic

**Total Lines Added:** ~150 lines (HTML UI + JavaScript + business logic)
**Backward Compatibility:** ✅ Yes (existing API still works, just enhanced)

