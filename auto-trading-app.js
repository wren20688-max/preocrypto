// Auto Trading Page Logic

let currentAccount = 'demo';
let demoBalance = 10000;
let realBalance = 0;
let botRunning = false;


function updateAccountUI() {
    document.getElementById('demoAccountBtn').classList.toggle('demo-active', currentAccount === 'demo');
    document.getElementById('realAccountBtn').classList.toggle('demo-active', currentAccount === 'real');
    document.getElementById('tradingAccountBalance').textContent =
        currentAccount === 'demo' ? `$${demoBalance.toLocaleString()}` : `$${realBalance.toLocaleString()}`;
}

async function loadBalances() {
    // Get username from localStorage/session (assume preo_user is set)
    const user = localStorage.getItem('preo_user');
    if (!user) return;
    demoBalance = await storage.getBalance(user, 'demo');
    realBalance = await storage.getBalance(user, 'real');
    updateAccountUI();
}

function switchTradingAccount(type) {
    currentAccount = type;
    updateAccountUI();
}

function setBotStatus(running) {
    botRunning = running;
    document.getElementById('botStatusText').textContent = running ? 'Running' : 'Stopped';
    document.getElementById('botStatusText').style.color = running ? '#27ae60' : '#e74c3c';
    document.getElementById('startBotBtn').disabled = running;
    document.getElementById('startBotBtn').style.opacity = running ? 0.5 : 1;
    document.getElementById('stopBotBtn').disabled = !running;
    document.getElementById('stopBotBtn').style.opacity = running ? 1 : 0.5;
}

document.getElementById('demoAccountBtn').onclick = () => switchTradingAccount('demo');
document.getElementById('realAccountBtn').onclick = () => switchTradingAccount('real');
document.getElementById('startBotBtn').onclick = function() {
    setBotStatus(true);
    // Simulate bot logic here
    alert('Auto Trading Bot Started on ' + (currentAccount === 'demo' ? 'Demo' : 'Real') + ' Account!');
};
document.getElementById('stopBotBtn').onclick = function() {
    setBotStatus(false);
    alert('Auto Trading Bot Stopped.');
};
document.getElementById('resetBotBtn').onclick = function() {
    setBotStatus(false);
    alert('Bot settings reset.');
};

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


loadBalances();
setBotStatus(false);
