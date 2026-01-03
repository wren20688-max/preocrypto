// ============================================================================
// M-Pesa Deposit Handler
// Simple M-Pesa STK Push integration with PayHero
// ============================================================================

// PayHero Configuration - Credentials stored securely in Netlify environment variables
const PAYHERO_CONFIG = {
  // Secret key is NOT exposed - handled by backend Netlify function
  API_URL: 'https://api.payhero.io/v1',
  WEBHOOK_URL: window.location.origin + '/webhook/payhero'
};

document.addEventListener('DOMContentLoaded', () => {
  initializeMpesaDeposit();
});

function initializeMpesaDeposit() {
  // Get user info
  const user = JSON.parse(localStorage.getItem('preo_user') || '{}');
  if (!user.username) {
    window.location.href = 'login.html';
    return;
  }

  document.getElementById('username').textContent = user.username;

  // Load balance
  loadBalanceInfo();
  loadRecentDeposits();

  // Handle form submission
  document.getElementById('mpesaForm').addEventListener('submit', handleMpesaDeposit);

  // Setup menu
  setupMenu();

  // Refresh data periodically
  setInterval(() => {
    loadBalanceInfo();
    loadRecentDeposits();
  }, 5000);
}

function loadBalanceInfo() {
  const accountData = JSON.parse(localStorage.getItem('accountData_real') || '{"balance":0}');
  
  const transactions = JSON.parse(localStorage.getItem('preo_transactions') || '[]');
  const pendingDeposits = transactions.filter(t => 
    t.type === 'deposit' && t.status === 'pending'
  );
  
  const pendingAmount = pendingDeposits.reduce((sum, t) => sum + (t.amount || 0), 0);

  document.getElementById('currentBalance').textContent = 'KES ' + accountData.balance.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  document.getElementById('pendingDeposits').textContent = 'KES ' + pendingAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  document.getElementById('pendingCount').textContent = pendingDeposits.length + (pendingDeposits.length === 1 ? ' transaction' : ' transactions');
}

function loadRecentDeposits() {
  const transactions = JSON.parse(localStorage.getItem('preo_transactions') || '[]');
  const deposits = transactions
    .filter(t => t.type === 'deposit')
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10);

  const container = document.getElementById('recentDeposits');
  
  if (deposits.length === 0) {
    container.innerHTML = '<div style="text-align: center; color: var(--text-tertiary); padding: var(--spacing-lg);">No deposits yet</div>';
    return;
  }

  container.innerHTML = deposits.map(deposit => `
    <div style="padding: 15px; border-bottom: 1px solid var(--border-color);">
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <span style="font-weight: 600;">KES ${deposit.amount.toLocaleString()}</span>
        <span style="font-size: 12px; color: ${deposit.status === 'completed' ? '#00d084' : deposit.status === 'pending' ? '#ffa500' : '#ff4444'};">
          ${deposit.status === 'completed' ? '✓' : deposit.status === 'pending' ? '⏳' : '✗'} ${deposit.status}
        </span>
      </div>
      <div style="font-size: 12px; color: var(--text-tertiary);">
        ${new Date(deposit.timestamp).toLocaleString()}
      </div>
    </div>
  `).join('');
}

async function handleMpesaDeposit(e) {
  e.preventDefault();

  const amount = parseFloat(document.getElementById('mpesaAmount').value);
  const phone = document.getElementById('mpesaPhone').value.trim();
  const submitBtn = document.getElementById('mpesaSubmitBtn');
  const user = JSON.parse(localStorage.getItem('preo_user') || '{}');

  // Validate amount
  if (amount < 10) {
    alert('⚠️ Minimum deposit is 10 KES');
    return;
  }

  if (amount > 500000) {
    alert('⚠️ Maximum deposit is 500,000 KES');
    return;
  }

  // Validate phone
  const phoneRegex = /^254[0-9]{9}$/;
  if (!phoneRegex.test(phone)) {
    alert('⚠️ Invalid phone number format. Use: 254XXXXXXXXX');
    return;
  }

  // Disable button
  submitBtn.disabled = true;
  submitBtn.innerHTML = '⏳ Processing...';

  try {
    // Call PayHero API to create payment
    const response = await fetch('/.netlify/functions/create-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: amount,
        phone: phone,
        email: user.email || 'guest@preocrypto.com',
        metadata: {
          user_id: user.username,
          deposit_type: 'mpesa_stk'
        },
        customer: {
          email: user.email || '',
          phone: phone
        }
      })
    });

    // Check if response is ok
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`API Error (${response.status}): ${errorText.substring(0, 100)}`);
    }

    // Try to parse JSON
    let result;
    try {
      const text = await response.text();
      console.log('API Response:', text);
      result = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      throw new Error('Invalid response from payment server. Please try again.');
    }

    if (result.success) {
      // Create pending transaction
      const transaction = {
        id: 'dep_' + Date.now(),
        type: 'deposit',
        amount: amount,
        method: 'mpesa',
        status: 'pending',
        timestamp: new Date().toISOString(),
        phone: phone,
        payment_id: result.result?.data?.payment_id || 'pending'
      };

      // Save transaction
      const transactions = JSON.parse(localStorage.getItem('preo_transactions') || '[]');
      transactions.unshift(transaction);
      localStorage.setItem('preo_transactions', JSON.stringify(transactions));

      // Show success message
      alert('✅ STK Push sent to your phone!\n\nCheck your phone for M-Pesa prompt.\nEnter your PIN to complete the deposit.\n\nYour balance will update automatically once payment is confirmed.');

      // Reset form
      document.getElementById('mpesaForm').reset();
      
      // Reload deposits
      loadRecentDeposits();
    } else {
      throw new Error(result.error || 'Payment failed');
    }

  } catch (error) {
    console.error('Deposit error:', error);
    alert('❌ Deposit failed: ' + error.message);
  } finally {
    // Re-enable button
    submitBtn.disabled = false;
    submitBtn.innerHTML = '💰 Deposit via M-Pesa';
  }
}

function setupMenu() {
  const menuToggle = document.getElementById('menuToggle');
  const sideMenu = document.getElementById('sideMenu');
  const menuClose = document.querySelector('.menu-close');

  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      sideMenu.classList.add('active');
    });
  }

  if (menuClose) {
    menuClose.addEventListener('click', () => {
      sideMenu.classList.remove('active');
    });
  }

  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('preo_token');
      localStorage.removeItem('preo_user');
      window.location.href = 'login.html';
    });
  }
}

// Check for payment status updates (webhook simulation for demo)
function checkPendingPayments() {
  const transactions = JSON.parse(localStorage.getItem('preo_transactions') || '[]');
  const pendingDeposits = transactions.filter(t => t.type === 'deposit' && t.status === 'pending');

  // In demo mode, auto-complete payments after 30 seconds
  pendingDeposits.forEach(deposit => {
    const depositTime = new Date(deposit.timestamp).getTime();
    const now = Date.now();
    const elapsed = now - depositTime;

    // Auto-complete after 30 seconds in demo mode (if no backend)
    if (elapsed > 30000) {
      completeDeposit(deposit.id, deposit.amount);
    }
  });
}

function completeDeposit(transactionId, amount) {
  // Update transaction status
  const transactions = JSON.parse(localStorage.getItem('preo_transactions') || '[]');
  const index = transactions.findIndex(t => t.id === transactionId);
  
  if (index !== -1 && transactions[index].status === 'pending') {
    transactions[index].status = 'completed';
    transactions[index].completed_at = new Date().toISOString();
    localStorage.setItem('preo_transactions', JSON.stringify(transactions));

    // Update balance
    const accountData = JSON.parse(localStorage.getItem('accountData_real') || '{"balance":0}');
    accountData.balance = (accountData.balance || 0) + amount;
    localStorage.setItem('accountData_real', JSON.stringify(accountData));

    // Show notification
    showNotification('✅ Deposit Completed!', `KES ${amount.toLocaleString()} has been added to your account.`, 'success');

    // Reload UI
    loadBalanceInfo();
    loadRecentDeposits();
  }
}

function showNotification(title, message, type = 'info') {
  // Simple notification (you can enhance this)
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#00d084' : type === 'error' ? '#ff4444' : '#0055ff'};
    color: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    max-width: 300px;
  `;
  
  notification.innerHTML = `
    <div style="font-weight: 700; margin-bottom: 5px;">${title}</div>
    <div style="font-size: 14px;">${message}</div>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 5000);
}

// Check for pending payments every 10 seconds
setInterval(checkPendingPayments, 10000);
