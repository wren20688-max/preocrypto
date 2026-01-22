// Auto Trading Page Logic


// --- Auto Trading Bot Logic (moved from inline script) ---
let botRunning = false;
let botStats = { trades: 0, wins: 0, losses: 0, pnl: 0 };
let tradingAccount = 'demo';
let lastTradeProfit = null;

function switchTradingAccount(account) {
    tradingAccount = account;
    window.currentTradingAccount = account;
    const demoBtn = document.getElementById('demoAccountBtn');
    const realBtn = document.getElementById('realAccountBtn');
    if (account === 'demo') {
        demoBtn.style.background = 'rgba(0, 212, 255, 0.15)';
        demoBtn.style.color = '#00d4ff';
        demoBtn.style.borderColor = '#00d4ff';
        realBtn.style.background = 'rgba(100, 100, 100, 0.1)';
        realBtn.style.color = '#999';
        realBtn.style.borderColor = 'transparent';
    } else {
        realBtn.style.background = 'rgba(255, 215, 0, 0.15)';
        realBtn.style.color = '#ffd700';
        realBtn.style.borderColor = '#ffd700';
        demoBtn.style.background = 'rgba(100, 100, 100, 0.1)';
        demoBtn.style.color = '#999';
        demoBtn.style.borderColor = 'transparent';
    }
    updateLastTradeResult();
    loadBalance();
    if (window.SyncManager) window.SyncManager.updateBalance();
    addLog('Switched to ' + (account === 'demo' ? 'Demo' : 'Real') + ' account for trading');
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!window.storage || !storage.isLoggedIn()) {
        window.location.href = 'index.html';
        return;
    }
    const user = await storage.getUser();
    if (user) {
        await loadBalance();
    }
    setInterval(() => loadBalance(), 2000);
    const startBtn = document.getElementById('startBotBtn');
    const stopBtn = document.getElementById('stopBotBtn');
    const resetBtn = document.getElementById('resetBotBtn');
    if (startBtn) startBtn.addEventListener('click', startBot);
    if (stopBtn) stopBtn.addEventListener('click', stopBot);
    if (resetBtn) resetBtn.addEventListener('click', resetBot);
    const demoBtn = document.getElementById('demoAccountBtn');
    const realBtn = document.getElementById('realAccountBtn');
    if (demoBtn) demoBtn.addEventListener('click', () => switchTradingAccount('demo'));
    if (realBtn) realBtn.addEventListener('click', () => switchTradingAccount('real'));
    updateUI();
    addLog('🚀 Auto Trading Bot loaded. Ready to start...');
});

function startBot() {
    (async () => {
        botRunning = true;
        updateUI();
        addLog('🤖 Bot initialized with ' + document.getElementById('botStrategy').value + ' strategy...');
        addLog('📊 Trading ' + document.getElementById('botVolume').value + ' units of ' + document.getElementById('botPair').value);
        addLog('💰 Account: ' + (tradingAccount === 'demo' ? 'Demo' : 'Real'));
        addLog('🎯 Max trades today: ' + document.getElementById('botMaxTrades').value);
        const vol = parseFloat(document.getElementById('botVolume').value) || 0;
        const approxNotional = vol * 100;
        if (tradingAccount === 'real') {
            const user = await storage.getUser();
            const realBalance = user?.real_balance || 0;
            if (approxNotional < 15) {
                botRunning = false;
                updateUI();
                addLog('❌ Minimum trade amount for real account is $15. Increase volume.');
                return;
            }
            if (realBalance < approxNotional) {
                botRunning = false;
                updateUI();
                addLog('❌ Insufficient real account balance to start bot. Required: $' + approxNotional.toFixed(2) + ', Available: $' + realBalance.toFixed(2));
                return;
            }
        }
        if (tradingAccount === 'demo') {
            addLog('✅ Demo account - no minimum restrictions');
        }
        simulateBotTrade();
    })();
}

async function simulateBotTrade() {
    if (!botRunning) return;
    const pair = document.getElementById('botPair').value;
    const volume = parseFloat(document.getElementById('botVolume').value);
    const approxNotional = volume * 100;
    if (tradingAccount === 'real') {
        if (approxNotional < 15) {
            addLog('⚠️ Skipped trade: below $15 minimum for real account');
            setTimeout(simulateBotTrade, 3000);
            return;
        }
        const user = await storage.getUser();
        const realBalance = user?.real_balance || 0;
        if (realBalance < approxNotional) {
            addLog('❌ Skipped trade: insufficient real account balance. Required: $' + approxNotional.toFixed(2) + ', Available: $' + realBalance.toFixed(2));
            setTimeout(simulateBotTrade, 3000);
            return;
        }
    }
    const strategy = document.getElementById('botStrategy').value;
    const tradeType = Math.random() > 0.5 ? 'BUY' : 'SELL';
    const user = await storage.getUser();
    const username = user?.username || user?.email;
    const currentBalance = tradingAccount === 'real' ? (user?.real_balance || 0) : (user?.demo_balance || 10000);
    addLog('[' + strategy + '] Signal generated - ' + tradeType + ' ' + volume + ' ' + pair);
    setTimeout(async () => {
        if (!botRunning) return;
        const profit = (Math.random() > 0.4) ? parseFloat((Math.random() * 100 + 50).toFixed(2)) : parseFloat((-(Math.random() * 100 + 25)).toFixed(2));
        const newBalance = currentBalance + profit;
        await storage.setBalance(username, newBalance, tradingAccount);
        if (window.SyncManager) window.SyncManager.triggerSync();
        await storage.addTrade({
            id: Date.now() + '_bot',
            pair: pair,
            type: tradeType,
            amount: volume,
            profit: profit,
            openTime: new Date().toISOString(),
            closeTime: new Date().toISOString(),
            account: tradingAccount,
            result: profit >= 0 ? 'win' : 'loss',
            strategy: strategy
        });
        await storage.addTransaction({
            id: Date.now() + '_bot_trade',
            type: 'bot_trade',
            pair: pair,
            tradeType: tradeType,
            amount: volume,
            profit: profit,
            timestamp: new Date().toISOString(),
            account: tradingAccount,
            status: 'completed'
        });
        lastTradeProfit = profit;
        updateLastTradeResult();
        if (profit > 0) {
            botStats.wins++;
            addLog('✅ Trade closed with PROFIT: +$' + profit.toFixed(2) + ' (Balance: $' + newBalance.toFixed(2) + ')');
        } else {
            botStats.losses++;
            addLog('❌ Trade closed with LOSS: $' + profit.toFixed(2) + ' (Balance: $' + newBalance.toFixed(2) + ')');
        }
        botStats.trades++;
        botStats.pnl += profit;
        updateStats();
        await loadBalance();
        if (botRunning && botStats.trades < parseInt(document.getElementById('botMaxTrades').value)) {
            setTimeout(simulateBotTrade, 3000);
        } else if (botStats.trades >= parseInt(document.getElementById('botMaxTrades').value)) {
            addLog('⏹️ Maximum daily trades reached. Bot stopping...');
            stopBot();
        }
    }, 2000);
}

function stopBot() {
    botRunning = false;
    updateUI();
    addLog('⏹️ Bot stopped');
}

function resetBot() {
    botStats = { trades: 0, wins: 0, losses: 0, pnl: 0 };
    document.getElementById('botLog').textContent = '🔄 Bot reset. Ready to start trading...';
    updateStats();
}

function addLog(message) {
    const logEl = document.getElementById('botLog');
    const time = new Date().toLocaleTimeString();
    const logEntry = '\n[' + time + '] ' + message;
    logEl.textContent += logEntry;
    logEl.scrollTop = logEl.scrollHeight;
}

function updateStats() {
    document.getElementById('statTrades').textContent = botStats.trades;
    document.getElementById('statWins').textContent = botStats.wins;
    document.getElementById('statLosses').textContent = botStats.losses;
    document.getElementById('statPnL').textContent = '$' + botStats.pnl.toFixed(2);
}

function updateUI() {
    const startBtn = document.getElementById('startBotBtn');
    const stopBtn = document.getElementById('stopBotBtn');
    if (startBtn) {
        startBtn.disabled = botRunning;
        startBtn.style.opacity = botRunning ? '0.5' : '1';
        startBtn.style.cursor = botRunning ? 'not-allowed' : 'pointer';
    }
    if (stopBtn) {
        stopBtn.disabled = !botRunning;
        stopBtn.style.opacity = botRunning ? '1' : '0.5';
        stopBtn.style.cursor = botRunning ? 'pointer' : 'not-allowed';
    }
    document.getElementById('botPair').disabled = botRunning;
    document.getElementById('botVolume').disabled = botRunning;
    document.getElementById('botStrategy').disabled = botRunning;
    const statusEl = document.getElementById('botStatusText');
    if (statusEl) {
        if (botRunning) {
            statusEl.textContent = 'Running 🟢';
            statusEl.style.color = 'var(--success)';
        } else {
            statusEl.textContent = 'Stopped 🔴';
            statusEl.style.color = 'var(--danger)';
        }
    }
}

function updateLastTradeResult() {
    const el = document.getElementById('lastTradeResult');
    if (el) {
        if (lastTradeProfit === null) {
            el.textContent = '';
        } else if (lastTradeProfit > 0) {
            el.textContent = `Profit taken: +$${lastTradeProfit.toFixed(2)}`;
            el.style.color = 'var(--success)';
        } else {
            el.textContent = `Loss: $${lastTradeProfit.toFixed(2)}`;
            el.style.color = 'var(--danger)';
        }
    }
}

async function loadBalance() {
    try {
        const user = await storage.getUser();
        let balance = 0;
        if (user) {
            if (tradingAccount === 'real') {
                balance = user.real_balance || 0;
            } else {
                balance = user.demo_balance || 10000;
            }
        } else {
            balance = tradingAccount === 'real' ? 0 : 10000;
        }
        document.getElementById('balance').textContent = '$' + parseFloat(balance).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        document.getElementById('tradingAccountBalance').textContent = '$' + parseFloat(balance).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    } catch (err) {
        console.error('Balance load error:', err);
        const defaultBalance = tradingAccount === 'real' ? 0 : 10000;
        document.getElementById('balance').textContent = '$' + defaultBalance.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        document.getElementById('tradingAccountBalance').textContent = '$' + defaultBalance.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    }
}

// Theme toggle
const toggleMode = document.getElementById('toggleMode');
if (toggleMode) {
    toggleMode.onclick = function() {
        document.body.classList.toggle('light-mode');
        localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
    };
    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-mode');
    }
}
