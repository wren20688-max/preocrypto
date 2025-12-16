// Simple market polling and order actions
(function(){
  function getApiBase(){
    try{
      if (typeof resolveApiBase === 'function') return resolveApiBase();
      const { protocol, hostname, port } = window.location;
      const override = localStorage.getItem('api_base');
      if (override && /^https?:\/\//i.test(override)) return override.replace(/\/$/, '');
      if (String(port) === '3000') return '';
      if (hostname) return `${protocol}//${hostname}:3000`;
      return 'http://localhost:3000';
    }catch{ return 'http://localhost:3000'; }
  }
  const apiBase = getApiBase();
  const priceEl = document.getElementById('live-prices');
  async function fetchPrices(){
    try{
      const r = await fetch(`${apiBase}/api/market/prices`);
      const j = await r.json();
      if(j?.success){
        const p = j.prices;
        if(priceEl){
          priceEl.textContent = `BTC ${p.BTCUSDT} | ETH ${p.ETHUSDT} | TRX ${p.TRXUSDT}`;
        }
      }
    }catch(e){ /* noop */ }
  }
  setInterval(fetchPrices, 1500);
  fetchPrices();
})();
// ============================================================================
// PreoCrypto - Dashboard Application
// Handles trading functionality, data management, and UI interactions
// ============================================================================

// ============================================================================
// GLOBAL STATE & CONFIG
// ============================================================================

let globalState = {
  currentAccount: 'demo',
  selectedPair: 'EUR/USD',
  tradeType: 'BUY',
  chart: null,
  chartType: 'area',
  currentTimeframe: 5, // seconds per candle (default 5s)
  drawingTool: 'select',
  priceData: {},
  positions: [],
  trades: [],
  user: null,
  accountBalances: {
    demo: { balance: 10000, equity: 10000, pnl: 0, positions: 0 },
    real: { balance: 0, equity: 0, pnl: 0, positions: 0 }
  }
};

const MARKET_DATA = {
  forex: [
    { symbol: 'EUR/USD', bid: 1.0945, ask: 1.0946, change: 0.12, pair: 'EURUSD' },
    { symbol: 'GBP/USD', bid: 1.2638, ask: 1.2639, change: -0.15, pair: 'GBPUSD' },
    { symbol: 'USD/JPY', bid: 149.48, ask: 149.49, change: 0.08, pair: 'USDJPY' },
    { symbol: 'AUD/USD', bid: 0.6648, ask: 0.6649, change: 0.22, pair: 'AUDUSD' },
    { symbol: 'USD/CAD', bid: 1.3527, ask: 1.3528, change: 0.05, pair: 'USDCAD' },
    { symbol: 'NZD/USD', bid: 0.6085, ask: 0.6086, change: -0.10, pair: 'NZDUSD' },
    { symbol: 'USD/CHF', bid: 0.8745, ask: 0.8746, change: 0.18, pair: 'USDCHF' },
    { symbol: 'EUR/GBP', bid: 0.8562, ask: 0.8563, change: 0.09, pair: 'EURGBP' },
    { symbol: 'EUR/JPY', bid: 163.24, ask: 163.26, change: 0.22, pair: 'EURJPY' },
    { symbol: 'GBP/JPY', bid: 190.45, ask: 190.48, change: -0.08, pair: 'GBPJPY' },
    { symbol: 'AUD/JPY', bid: 99.28, ask: 99.30, change: 0.15, pair: 'AUDJPY' },
    { symbol: 'USD/SGD', bid: 1.3345, ask: 1.3347, change: 0.05, pair: 'USDSGD' }
  ],
  crypto: [
    { symbol: 'Bitcoin', price: 45230, change24h: 2.34, cap: '884B', pair: 'BTCUSD' },
    { symbol: 'Ethereum', price: 2450, change24h: 1.82, cap: '294B', pair: 'ETHUSD' },
    { symbol: 'XRP', price: 2.85, change24h: 0.45, cap: '155B', pair: 'XRPUSD' },
    { symbol: 'Litecoin', price: 125.45, change24h: -0.32, cap: '19B', pair: 'LTCUSD' },
    { symbol: 'Cardano', price: 1.08, change24h: 1.12, cap: '38B', pair: 'ADAUSD' },
    { symbol: 'Dogecoin', price: 0.38, change24h: 2.15, cap: '55B', pair: 'DOGEUSD' }
  ],
  stocks: [
    { symbol: 'Apple Inc.', price: 235.45, change24h: 1.23, pair: 'AAPL' },
    { symbol: 'Microsoft Corp.', price: 428.72, change24h: 0.95, pair: 'MSFT' },
    { symbol: 'Alphabet Inc.', price: 156.89, change24h: 2.15, pair: 'GOOGL' },
    { symbol: 'Amazon.com Inc.', price: 203.45, change24h: 1.42, pair: 'AMZN' },
    { symbol: 'Tesla Inc.', price: 312.65, change24h: -0.78, pair: 'TSLA' },
    { symbol: 'NVIDIA Corp.', price: 889.23, change24h: 3.45, pair: 'NVDA' },
    { symbol: 'Meta Platforms', price: 542.15, change24h: 2.67, pair: 'META' },
    { symbol: 'JPMorgan Chase', price: 198.34, change24h: 0.52, pair: 'JPM' },
    { symbol: 'Visa Inc.', price: 284.56, change24h: 1.08, pair: 'V' },
    { symbol: 'Johnson & Johnson', price: 156.78, change24h: 0.34, pair: 'JNJ' },
    { symbol: 'Walmart Inc.', price: 89.23, change24h: 0.67, pair: 'WMT' },
    { symbol: 'Disney Inc.', price: 92.45, change24h: -0.45, pair: 'DIS' },
    { symbol: 'Netflix Inc.', price: 234.67, change24h: 1.89, pair: 'NFLX' },
    { symbol: 'IBM Corp.', price: 187.34, change24h: 0.78, pair: 'IBM' },
    { symbol: 'Intel Corp.', price: 45.67, change24h: -1.23, pair: 'INTC' }
  ]
};

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

function initializeApp() {
  let appUser = storage.getUser();
    if (!appUser) {
      appUser = { username: 'Guest', email: 'guest@local', id: 'guest', guest: true };
      try { if (!localStorage.getItem('accountData_demo')) localStorage.setItem('accountData_demo', JSON.stringify({ balance: 10000, equity: 10000, pnl: 0, positions: 0 })); } catch {}
    try { if (!localStorage.getItem('accountData_demo')) localStorage.setItem('accountData_demo', JSON.stringify({ balance: 10000, equity: 10000, pnl: 0, positions: 0 })); } catch {}
  }

  globalState.user = appUser;
  
  // Default to 5-second timeframe on page load
  globalState.currentTimeframe = 5;
  
  // Setup UI
  const usernameEl = document.getElementById('username');
  if (usernameEl) usernameEl.textContent = appUser.username || 'User';
  
  // Load data
  loadBalanceData();
  renderMarketData();
  
  // Initialize chart first, then setup listeners
  setTimeout(() => {
    initChart();
    // Setup event listeners AFTER chart is initialized
    setupEventListeners();
  }, 500);
  
  // Update prices frequently for faster movement
  setInterval(updatePrices, 300);

  // Prime lists once app is ready
  setTimeout(() => { try { loadRecentTrades(); loadOpenPositions(); } catch {} }, 800);

  // If guest, show a gentle banner/toast about limited mode
  if (appUser.guest) {
    try { showNotification('Guest mode: Log in for real trading and syncing.', 'info'); } catch {}
  }
}

// Resolve API base robustly for hosted domains (Vercel/custom)
function resolveApiBase() {
  try {
    // 1) Explicit globals set by hosting/platform
    const winBase = window.API_BASE || window.__API_BASE || (window.env && window.env.API_BASE);
    if (winBase && /^https?:\/\//i.test(winBase)) return String(winBase).replace(/\/$/, '');
    // 2) Meta tag support: <meta name="api-base" content="https://api.example.com">
    const meta = document.querySelector('meta[name="api-base"]');
    if (meta && /^https?:\/\//i.test(meta.content)) return meta.content.replace(/\/$/, '');
    // 3) LocalStorage override for manual config
    const override = localStorage.getItem('api_base');
    if (override && /^https?:\/\//i.test(override)) return override.replace(/\/$/, '');
    // 4) Same-origin when served by backend on :3000
    const { protocol, hostname, port } = window.location;
    if (String(port) === '3000') return '';
    if (hostname) return `${protocol}//${hostname}:3000`;
    // 5) Fallback to localhost dev
    return 'http://localhost:3000';
  } catch { return 'http://localhost:3000'; }
}

// ============================================================================
// DATA LOADING & BALANCE MANAGEMENT
// ============================================================================

function loadBalanceData() {
  // Check if current user is a marketer
    let currentUser = globalState.user;
    const marketers = JSON.parse(localStorage.getItem('marketers') || '[]');
    const marketer = marketers.find(m => m.email === currentUser.email);
  
  let demoData, realData;
  
  if (marketer && marketer.isMarketer) {
    // Marketer: Load balance from marketer account (live trading only)
    realData = {
      balance: marketer.balance,
      equity: marketer.balance,
      pnl: 0,
      positions: 0
    };
    demoData = { balance: 10000, equity: 10000, pnl: 0, positions: 0 };
    
    // Store marketer data
    localStorage.setItem('accountData_real', JSON.stringify(realData));
    localStorage.setItem('accountData_demo', JSON.stringify(demoData));
  } else {
    // Regular user: Load from localStorage
    demoData = JSON.parse(localStorage.getItem('accountData_demo') || '{"balance":10000,"equity":10000,"pnl":0,"positions":0}');
    realData = JSON.parse(localStorage.getItem('accountData_real') || '{"balance":0,"equity":0,"pnl":0,"positions":0}');
    
    // Ensure real account always starts at 0 if not explicitly set by deposits/trades
    if (!localStorage.getItem('accountData_real')) {
      localStorage.setItem('balance_real', '0');
    }
  }
  
  globalState.accountBalances.demo = demoData;
  globalState.accountBalances.real = realData;
  
  // Display current account data
  updateAccountDisplay();
}

function updateAccountDisplay() {
  const account = globalState.currentAccount;
  const data = globalState.accountBalances[account];
  
  // Update display
  updateBalance(data.balance);
  updatePnL(data.pnl);
  updateEquity(data.equity);
  updateOpenPositionsCount();
  
  // Save preference
  localStorage.setItem('currentAccount', account);
}

function saveAccountData() {
  const account = globalState.currentAccount;
  const data = globalState.accountBalances[account];
  localStorage.setItem(`accountData_${account}`, JSON.stringify(data));
  
  // Also save individual balance values for easy access from other pages
  localStorage.setItem(`accountData_${account}_balance`, data.balance.toString());
  localStorage.setItem(`accountData_${account}_equity`, data.equity.toString());
  localStorage.setItem(`accountData_${account}_pnl`, data.pnl.toString());
  
  // If user is a marketer on real account, also update marketer balance
  if (account === 'real') {
    let accUser = globalState.user;
    const marketers = JSON.parse(localStorage.getItem('marketers') || '[]');
    const marketer = marketers.find(m => m.email === accUser.email);
    
    if (marketer && marketer.isMarketer) {
      marketer.balance = data.balance;
      localStorage.setItem('marketers', JSON.stringify(marketers));
    }
  }
}

function updateBalance(amount) {
  document.getElementById('balance').textContent = '$' + amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  globalState.accountBalances[globalState.currentAccount].balance = amount;
  saveAccountData();
}

function updateEquity(amount) {
  document.getElementById('equity').textContent = '$' + amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  globalState.accountBalances[globalState.currentAccount].equity = amount;
  saveAccountData();
}

function updatePnL(amount) {
  const pnlElement = document.getElementById('todayPnL');
  pnlElement.textContent = (amount >= 0 ? '+' : '') + '$' + amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  pnlElement.style.color = amount >= 0 ? 'var(--success)' : 'var(--danger)';
  globalState.accountBalances[globalState.currentAccount].pnl = amount;
  saveAccountData();
}

// ============================================================================
// MARKET DATA & RENDERING
// ============================================================================

function renderMarketData() {
  renderForexPairs();
  renderCryptoPairs();
}

function renderForexPairs() {
  const container = document.getElementById('forexList');
  container.innerHTML = '';
  
  MARKET_DATA.forex.forEach(item => {
    const row = createTableRow({
      pair: item.symbol,
      price: item.ask.toFixed(4),
      change: item.change,
      bidAsk: `${item.bid.toFixed(4)}/${item.ask.toFixed(4)}`,
      symbol: item.symbol,
      pairCode: item.pair
    });
    container.appendChild(row);
  });
}

function renderCryptoPairs() {
  const container = document.getElementById('cryptoList');
  container.innerHTML = '';
  
  MARKET_DATA.crypto.forEach(item => {
    const row = createTableRow({
      pair: item.symbol,
      price: '$' + item.price.toLocaleString(),
      change: item.change24h,
      bidAsk: item.cap,
      symbol: item.symbol,
      pairCode: item.pair
    });
    container.appendChild(row);
  });
}

function createTableRow(data) {
  const row = document.createElement('div');
  row.className = 'table-row';
  const changeClass = data.change >= 0 ? 'positive' : 'negative';
  
  row.innerHTML = `
    <div class="col-pair">${data.pair}</div>
    <div class="col-price">${data.price}</div>
    <div class="col-change ${changeClass}">${data.change >= 0 ? '+' : ''}${data.change.toFixed(2)}%</div>
    <div class="col-bid-ask">${data.bidAsk}</div>
    <div class="col-action">
      <button class="btn btn-primary btn-small" onclick="openTradeModal('${data.pairCode}', '${data.symbol}')">Trade</button>
    </div>
  `;
  
  return row;
}

// ============================================================================
// PRICE UPDATES & CHART UPDATES
// ============================================================================

let lastCandleTime = Math.floor(Date.now() / 1000);
let currentCandleData = null;

function updatePrices() {
  // Simulate realistic price movements
  MARKET_DATA.forex.forEach(item => {
    // Increase volatility slightly for faster visual movement
    const changeAmount = (Math.random() - 0.5) * 0.0003;
    item.bid += changeAmount;
    item.ask += changeAmount;
    item.change += (Math.random() - 0.5) * 0.1;
  });
  
  MARKET_DATA.crypto.forEach(item => {
    const changeAmount = (Math.random() - 0.5) * 100;
    item.price += changeAmount;
    item.change24h += (Math.random() - 0.5) * 0.2;
  });
  
  // Update market ticker display
  updateTicker();
  
  // Time-based candle creation according to current timeframe (seconds per candle)
  if (globalState.chart) {
    const now = Math.floor(Date.now() / 1000);
    if ((now - lastCandleTime) >= globalState.currentTimeframe) {
      updateChartWithNewCandle();
    }
  }
}

function updateChartWithNewCandle() {
  if (!globalState.chart) return;
  
  const currentPrice = MARKET_DATA.forex[0].ask;
  const currentTime = Math.floor(Date.now() / 1000);
  
  // Create new candle data
  const newCandle = {
    time: currentTime,
    open: currentPrice * (0.9995 + Math.random() * 0.001),
    close: currentPrice,
    high: currentPrice * (1 + Math.random() * 0.001),
    low: currentPrice * (0.9995 - Math.random() * 0.0005)
  };
  
  // Get candlestick series
  const candleSeries = globalState.chart.series()[0];
  if (candleSeries && candleSeries.update) {
    candleSeries.update(newCandle);
  }
  
  lastCandleTime = currentTime;
}

function updateTicker() {
  const items = document.querySelectorAll('.ticker-item');
  const data = [
    MARKET_DATA.forex[0],
    MARKET_DATA.forex[1],
    MARKET_DATA.crypto[0]
  ];
  
  items.forEach((item, idx) => {
    if (data[idx]) {
      const price = data[idx].ask || data[idx].price;
      const change = data[idx].change || data[idx].change24h;
      
      item.querySelector('.ticker-price').textContent = 
        typeof price === 'number' && price > 100 ? price.toFixed(0) : price.toFixed(4);
      
      const changeEl = item.querySelector('.ticker-change');
      changeEl.textContent = (change >= 0 ? '+' : '') + change.toFixed(2) + '%';
      changeEl.className = 'ticker-change ' + (change >= 0 ? 'green' : 'red');
    }
  });
}

// ============================================================================
// TECHNICAL INDICATORS
// ============================================================================

function calculateSMA(data, period = 20) {
  const smas = [];
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const sum = slice.reduce((acc, val) => acc + val.close, 0);
    smas.push({ time: data[i].time, value: sum / period });
  }
  return smas;
}

function calculateEMA(data, period = 12) {
  const emas = [];
  const k = 2 / (period + 1);
  let ema = data[0].close;
  
  for (let i = 0; i < data.length; i++) {
    ema = data[i].close * k + ema * (1 - k);
    emas.push({ time: data[i].time, value: ema });
  }
  return emas;
}

function calculateRSI(data, period = 14) {
  const rsis = [];
  let gains = 0, losses = 0;
  
  for (let i = 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    if (change > 0) gains += change;
    else losses -= change;
    
    if (i === period) {
      const rs = gains / losses || 0;
      const rsi = 100 - (100 / (1 + rs));
      rsis.push({ time: data[i].time, value: rsi });
    } else if (i > period) {
      gains = (gains * (period - 1) + Math.max(change, 0)) / period;
      losses = (losses * (period - 1) + Math.max(-change, 0)) / period;
      const rs = gains / losses || 0;
      const rsi = 100 - (100 / (1 + rs));
      rsis.push({ time: data[i].time, value: rsi });
    }
  }
  return rsis;
}

function calculateMACD(data, fast = 12, slow = 26, signal = 9) {
  const fastEMA = calculateEMA(data, fast);
  const slowEMA = calculateEMA(data, slow);
  const macdLine = [];
  
  for (let i = slow - 1; i < fastEMA.length; i++) {
    macdLine.push({
      time: data[i].time,
      value: fastEMA[i].value - slowEMA[i - (fast - 1)].value
    });
  }
  
  return macdLine;
}

function calculateBollingerBands(data, period = 20, stdDev = 2) {
  const sma = calculateSMA(data, period);
  const bands = [];
  
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const mean = slice.reduce((sum, d) => sum + d.close, 0) / period;
    const variance = slice.reduce((sum, d) => sum + Math.pow(d.close - mean, 2), 0) / period;
    const stdDev_ = Math.sqrt(variance);
    
    bands.push({
      time: data[i].time,
      upper: mean + (stdDev * stdDev_),
      middle: mean,
      lower: mean - (stdDev * stdDev_)
    });
  }
  return bands;
}

function calculateATR(data, period = 14) {
  const atrs = [];
  let tr_sum = 0;
  
  for (let i = 1; i < data.length; i++) {
    const high = data[i].high;
    const low = data[i].low;
    const close = data[i - 1].close;
    
    const tr = Math.max(high - low, Math.abs(high - close), Math.abs(low - close));
    
    if (i === period) {
      tr_sum += tr;
      atrs.push({ time: data[i].time, value: tr_sum / period });
    } else if (i > period) {
      tr_sum = (tr_sum * (period - 1) + tr) / period;
      atrs.push({ time: data[i].time, value: tr_sum });
    } else {
      tr_sum += tr;
    }
  }
  return atrs;
}

function calculateStochastic(data, period = 14) {
  const stoch = [];
  
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const high = Math.max(...slice.map(d => d.high));
    const low = Math.min(...slice.map(d => d.low));
    const close = data[i].close;
    
    const k = ((close - low) / (high - low)) * 100;
    stoch.push({ time: data[i].time, value: k });
  }
  return stoch;
}

function calculateCCI(data, period = 20) {
  const cci = [];
  
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const tp = slice.map(d => (d.high + d.low + d.close) / 3);
    const sma = tp.reduce((a, b) => a + b) / period;
    const mad = tp.reduce((sum, val) => sum + Math.abs(val - sma), 0) / period;
    
    const cciVal = mad !== 0 ? (tp[period - 1] - sma) / (0.015 * mad) : 0;
    cci.push({ time: data[i].time, value: cciVal });
  }
  return cci;
}

function calculateWilliamsR(data, period = 14) {
  const williams = [];
  
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const high = Math.max(...slice.map(d => d.high));
    const low = Math.min(...slice.map(d => d.low));
    const close = data[i].close;
    
    const r = ((high - close) / (high - low)) * -100;
    williams.push({ time: data[i].time, value: r });
  }
  return williams;
}

// ============================================================================
// CHART INITIALIZATION & MANAGEMENT
// ============================================================================

let __lwcLocalFallbackInjected = false;
let __debugOverlay;
function showDebug(msg){
  try{
    const params = new URLSearchParams(location.search);
    if (!params.get('debug')) return;
    if (!__debugOverlay){
      __debugOverlay = document.createElement('div');
      __debugOverlay.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:9999;background:rgba(0,0,0,0.7);color:#0ff;padding:8px 10px;border:1px solid #0ff;border-radius:6px;font-family:monospace;font-size:12px;max-width:80vw;pointer-events:none;white-space:pre-wrap;';
      document.body.appendChild(__debugOverlay);
    }
    const now = new Date().toLocaleTimeString();
    __debugOverlay.textContent = `[${now}] ${msg}`;
  }catch{}
}
async function initChart() {
  const container = document.getElementById('mainChart');
  if (!container) {
    console.error('Chart container not found');
    showDebug('Chart container not found');
    return;
  }
  // Wait until container has a usable size (some phones paint later)
  const cw = container.clientWidth || 0;
  const ch = container.clientHeight || 0;
  showDebug(`container size -> ${cw}x${ch}`);
  if (cw < 50 || ch < 150) {
    // Force a layout reflow before retry (Android low-RAM devices)
    try { void container.offsetHeight; } catch {}
    showDebug('container too small, retrying in 300ms');
    setTimeout(initChart, 300);
    return;
  }
  // As a last resort, ensure a sensible height is set before creating chart
  if (ch < 200) {
    const targetH = Math.max(320, Math.floor(window.innerHeight * 0.55));
    container.style.height = targetH + 'px';
    showDebug('Enforced container height: ' + targetH);
  }
  
  // Force container to have dimensions
  const width = container.clientWidth || 800;
  const height = container.clientHeight || 450;
  
  console.log('Chart container found, size:', width, 'x', height);
  
  // Wait for LightweightCharts to load
  if (!window.LightweightCharts) {
    console.warn('LightweightCharts not loaded yet, retrying...');
    showDebug('LightweightCharts not loaded; injecting local fallback and retrying');
    // Attempt local fallback once if CDN hasn't loaded
    if (!__lwcLocalFallbackInjected) {
      try {
        const s = document.createElement('script');
        s.src = 'libs/lightweight-charts.min.js';
        document.head.appendChild(s);
        __lwcLocalFallbackInjected = true;
      } catch {}
    }
    setTimeout(initChart, 700);
    return;
  }
  
  console.log('LightweightCharts library loaded');
  
  try {
    // Double rAF to ensure layout is stable before chart creation
    await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
    // Detect user locale/timezone for tick formatting
    const savedPrefs = (window.storage && storage.getUserPrefs && storage.getUserPrefs()) || {};
    const userLocale = savedPrefs.locale || (navigator.language || 'en-US');
    const userTimeZone = savedPrefs.timeZone || (Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
    try { if (window.storage && storage.setUserPrefs) storage.setUserPrefs({ locale: userLocale, timeZone: userTimeZone }); } catch {}
    globalState.userLocale = userLocale;
    globalState.userTimeZone = userTimeZone;

    globalState.chart = LightweightCharts.createChart(container, {
      width: width,
      height: height,
      layout: {
        background: { color: '#0f1419' },
        textColor: '#d1d5db'
      },
      grid: {
        vertLines: {
          color: 'rgba(45, 55, 72, 0.6)',
          style: (window.LightweightCharts?.LineStyle?.Solid ?? 0)
        },
        horzLines: {
          color: 'rgba(45, 55, 72, 0.6)',
          style: (window.LightweightCharts?.LineStyle?.Solid ?? 0)
        }
      },
      crosshair: {
        mode: (window.LightweightCharts?.CrosshairMode?.Normal ?? 0),
        vertLine: {
          color: 'rgba(136, 153, 170, 0.9)',
          width: 1,
          style: (window.LightweightCharts?.LineStyle?.Dashed ?? 1),
          labelVisible: true
        },
        horzLine: {
          color: 'rgba(136, 153, 170, 0.9)',
          width: 1,
          style: (window.LightweightCharts?.LineStyle?.Dashed ?? 1),
          labelVisible: true
        }
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
        rightOffset: 0,
        fixRightEdge: true,
        lockVisibleTimeRangeOnResize: true,
        tickMarkFormatter: (time, type, locale) => {
          try {
            const dt = new Date((typeof time === 'number' ? time : time.utc) * 1000);
            return dt.toLocaleTimeString(globalState.userLocale, {
              hour: '2-digit', minute: '2-digit', second: '2-digit',
              hour12: false, timeZone: globalState.userTimeZone
            });
          } catch { return '' }
        }
      },
      rightPriceScale: {
        borderColor: '#2d3748',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1
        }
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true
      },
      handleScale: {
        axisDoubleClickReset: true,
        mouseWheel: true,
        pinch: true
      },
      localization: {
        locale: userLocale
      }
    });
    
    console.log('Chart object created:', !!globalState.chart);
    showDebug('Chart object created: ' + (!!globalState.chart));
    // Track series references to avoid overlaps
    globalState.seriesRefs = [];
    
    const series = createChartSeries(globalState.chart, globalState.chartType);
    console.log('Chart series created:', !!series);
    // Add simulated bid/ask overlay
    addBidAskOverlay(globalState.chart, series);
    // Add horizontal guide lines near round numbers for clearer levels
    addGuideLines(globalState.chart, series);
      // Add indicator overlays based on current selections
      addIndicatorOverlays(globalState.chart, series);
    // Start simulated ticks to visibly move prices (rAF-driven)
    startSimTicks(globalState.chart, series);
    
    // Display indicators
    displayIndicators();
    
    console.log('Chart initialized successfully');
    showDebug('Chart initialized successfully');
    // Fallback: if canvas didn't mount, retry once after a short delay
    setTimeout(() => {
      const hasCanvas = container.querySelector('canvas');
      if (!hasCanvas) {
        try { console.warn('Chart canvas missing, retrying init...'); initChart(); } catch {}
        showDebug('Canvas missing; re-running init');
      }
    }, 800);
    
    // Handle window resize
    window.addEventListener('resize', () => {
      if (globalState.chart && container) {
        const newWidth = container.clientWidth || 800;
        const newHeight = container.clientHeight || 450;
        globalState.chart.applyOptions({ width: newWidth, height: newHeight });
      }
    });

    // Resize observer for layout changes (mobile keyboard/orientation)
    try {
      const ro = new ResizeObserver(() => {
        if (globalState.chart && container) {
          globalState.chart.applyOptions({
            width: container.clientWidth || 800,
            height: container.clientHeight || 450
          });
        }
      });
      ro.observe(container);
      globalState.__chartRO = ro;
    } catch {}

    // Orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        if (globalState.chart && container) {
          globalState.chart.applyOptions({
            width: container.clientWidth || 800,
            height: container.clientHeight || 450
          });
        }
      }, 250);
    });
  } catch (err) {
    console.error('Error initializing chart:', err);
    showDebug('Error initializing chart: ' + (err && err.message));
  }
}

function createChartSeries(chart, chartType) {
  if (!chart) {
    console.error('Chart object is null');
    return;
  }
  
  // Remove previously tracked series (reliable for Lightweight Charts)
  if (globalState.seriesRefs && Array.isArray(globalState.seriesRefs)) {
    let removed = 0;
    globalState.seriesRefs.forEach(s => {
      try { chart.removeSeries(s); removed++; } catch {}
    });
    globalState.seriesRefs = [];
    if (removed) console.log(`✓ Removed ${removed} existing series`);
  }
  // Stop any running tick timers before creating new series
  if (globalState.tickTimer) {
    try { cancelAnimationFrame(globalState.tickTimer); } catch {}
    globalState.tickTimer = null;
  }
  
  const data = generateCandleData();
  if (!data || data.length === 0) {
    console.error('No chart data generated');
    return;
  }
  
  console.log(`Creating ${chartType} series with ${data.length} candles, timeframe: ${globalState.currentTimeframe}s`);
  
  let series;
  
  try {
    switch(chartType) {
      case 'candlestick':
        series = chart.addCandlestickSeries({
          upColor: '#00d084',
          downColor: '#ff4757',
          borderDownColor: '#ff4757',
          borderUpColor: '#00d084',
          wickDownColor: '#ff4757',
          wickUpColor: '#00d084'
        });
        series.setData(data);
        console.log('✓ Candlestick series created and data set');
        break;
        
      case 'line':
        series = chart.addLineSeries({
          color: '#0055ff',
          lineWidth: 2,
          crosshairMarkerVisible: true
        });
        const lineData = data.map(d => ({ time: d.time, value: d.close }));
        series.setData(lineData);
        console.log('✓ Line series created and data set');
        break;
        
      case 'area':
        series = chart.addAreaSeries({
          lineColor: '#0055ff',
          topColor: '#0055ff33',
          bottomColor: '#0055ff00',
          lineWidth: 2,
          crosshairMarkerVisible: true
        });
        const areaData = data.map(d => ({ time: d.time, value: d.close }));
        series.setData(areaData);
        console.log('✓ Area series created and data set');
        break;
        
      case 'bar':
        series = chart.addBarSeries({
          upColor: '#00d084',
          downColor: '#ff4757',
          openVisible: false
        });
        series.setData(data);
        console.log('✓ Bar series created and data set');
        break;
        
      default:
        console.error('Unknown chart type:', chartType);
        return;
    }
    
    if (series && chart.timeScale) {
      chart.timeScale().fitContent();
      console.log('✓ Chart time scale fitted');
    }
    
    // Force redraw
    if (chart.applyOptions) {
      chart.applyOptions({});
      console.log('✓ Chart options applied (forced redraw)');
    }
  } catch (err) {
    console.error('Error creating chart series:', err);
  }
  
  // Track the primary series
  if (!globalState.seriesRefs) globalState.seriesRefs = [];
  if (series) globalState.seriesRefs.push(series);

  return series;
}

// Add simulated bid/ask overlay lines based on close values and a small spread
function addBidAskOverlay(chart, baseSeries) {
  try {
    if (!chart || !baseSeries) return;
    // Distinct colors for bid/ask to make spread visible
    const bidSeries = chart.addLineSeries({ color: '#f39c12', lineWidth: 2, lineStyle: (window.LightweightCharts?.LineStyle?.Dotted ?? 0) });
    const askSeries = chart.addLineSeries({ color: '#e74c3c', lineWidth: 2, lineStyle: (window.LightweightCharts?.LineStyle?.Dotted ?? 0) });
    const data = baseSeries._data || null; // internal not exposed; recompute from generator
    const candles = generateCandleData();
    const pairSel = document.getElementById('pairSelector');
    const meta = getSymbolMeta(pairSel ? pairSel.value : 'EURUSD');
    const pip = meta.pip;
    const dyn = getSymbolDynamics(meta.symbol);
    const half = (dyn.spreadPips * pip) / 2; // symbol-specific spread
    const bid = candles.map(c => ({ time: c.time, value: c.close - half }));
    const ask = candles.map(c => ({ time: c.time, value: c.close + half }));
    bidSeries.setData(bid);
    askSeries.setData(ask);
    if (!globalState.seriesRefs) globalState.seriesRefs = [];
    globalState.seriesRefs.push(bidSeries);
    globalState.seriesRefs.push(askSeries);
  } catch (e) {
    console.warn('Bid/Ask overlay error:', e.message);
  }
}

// Add horizontal dotted guide lines around round-number levels (top/mid/bottom)
function addGuideLines(chart, baseSeries) {
  try {
    const candles = generateCandleData();
    if (!candles || candles.length === 0) return;
    const last = candles[candles.length - 1];
    const pairSel = document.getElementById('pairSelector');
    const meta = getSymbolMeta(pairSel ? pairSel.value : 'EURUSD');
    const dec = meta.decimals;
    // Round to 2 decimals for readability (FX majors), adjust for JPY/crypto
    const roundUnit = (/JPY/.test(meta.symbol)) ? 0.1 : (meta.category === 'crypto' ? 1 : 0.01);
    const baseLevel = Math.round(last.close / roundUnit) * roundUnit;
    const top = parseFloat((baseLevel + roundUnit).toFixed(dec));
    const mid = parseFloat(baseLevel.toFixed(dec));
    const bot = parseFloat((baseLevel - roundUnit).toFixed(dec));
    const times = candles.map(c => c.time);
    const mkSeries = (color) => chart.addLineSeries({ color, lineWidth: 1, lineStyle: (window.LightweightCharts?.LineStyle?.Dotted ?? 0) });
    const topS = mkSeries('#ff4757');
    const midS = mkSeries('#00d084');
    const botS = mkSeries('#f39c12');
    topS.setData(times.map(t => ({ time: t, value: top })));
    midS.setData(times.map(t => ({ time: t, value: mid })));
    botS.setData(times.map(t => ({ time: t, value: bot })));
    if (!globalState.seriesRefs) globalState.seriesRefs = [];
    globalState.seriesRefs.push(topS, midS, botS);
    // Store for live updates
    globalState.guideLines = { topS, midS, botS, roundUnit, dec };
  } catch (e) {}
}

// Add indicator overlays (SMA, EMA, Bollinger Bands) as visible chart series
function addIndicatorOverlays(chart, baseSeries) {
  try {
    if (!chart || !baseSeries) return;
    // Clear previous indicator overlays only
    if (!globalState.indicatorSeriesRefs) globalState.indicatorSeriesRefs = [];
    globalState.indicatorSeriesRefs.forEach(s => { try { chart.removeSeries(s); } catch {} });
    globalState.indicatorSeriesRefs = [];

    // Determine selected indicators from checkboxes (dashboard.html / indicatorsTab)
    const selected = [];
    ['sma','ema','bb'].forEach(id => { if (document.getElementById(`ind-${id}`)?.checked) selected.push(id); });
    if (selected.length === 0) return;

    const candles = generateCandleData();
    if (!candles || candles.length === 0) return;

    // SMA(20)
    if (selected.includes('sma')) {
      const sma = calculateSMA(candles, 20).map(d => ({ time: d.time, value: d.value }));
      const smaSeries = chart.addLineSeries({ color: '#4de9ff', lineWidth: 2 });
      smaSeries.setData(sma);
      globalState.indicatorSeriesRefs.push(smaSeries);
    }

    // EMA(12)
    if (selected.includes('ema')) {
      const ema = calculateEMA(candles, 12).map(d => ({ time: d.time, value: d.value }));
      const emaSeries = chart.addLineSeries({ color: '#00d084', lineWidth: 2 });
      emaSeries.setData(ema);
      globalState.indicatorSeriesRefs.push(emaSeries);
    }

    // Bollinger Bands (20, 2)
    if (selected.includes('bb')) {
      const bb = calculateBollingerBands(candles, 20, 2);
      const upper = bb.map(b => ({ time: b.time, value: b.upper }));
      const middle = bb.map(b => ({ time: b.time, value: b.middle }));
      const lower = bb.map(b => ({ time: b.time, value: b.lower }));
      const dashed = (window.LightweightCharts?.LineStyle?.Dashed ?? 1);
      const upS = chart.addLineSeries({ color: '#ffa502', lineWidth: 1, lineStyle: dashed });
      const midS = chart.addLineSeries({ color: '#8899aa', lineWidth: 1 });
      const loS = chart.addLineSeries({ color: '#ffa502', lineWidth: 1, lineStyle: dashed });
      upS.setData(upper); midS.setData(middle); loS.setData(lower);
      globalState.indicatorSeriesRefs.push(upS, midS, loS);
    }
  } catch (e) {
    console.warn('Indicator overlay error:', e.message);
  }
}

// Utility: per-symbol volatility and spread
// Meta info: base price, pip size, decimal precision
function getSymbolMeta(symbol){
  const s = String(symbol || '').toUpperCase();
  // Crypto
  if (/BTC/.test(s)) return { symbol: s, category: 'crypto', basePrice: 43000, pip: 1, decimals: 2 };
  if (/ETH/.test(s)) return { symbol: s, category: 'crypto', basePrice: 2300, pip: 0.5, decimals: 2 };
  if (/XRP/.test(s)) return { symbol: s, category: 'crypto', basePrice: 0.60, pip: 0.0001, decimals: 4 };
  if (/ADA/.test(s)) return { symbol: s, category: 'crypto', basePrice: 0.50, pip: 0.0001, decimals: 4 };
  if (/DOGE/.test(s)) return { symbol: s, category: 'crypto', basePrice: 0.095, pip: 0.0001, decimals: 4 };
  if (/LTC/.test(s)) return { symbol: s, category: 'crypto', basePrice: 75, pip: 0.1, decimals: 2 };
  // Metals/CFD examples
  if (/XAU/.test(s)) return { symbol: s, category: 'fx', basePrice: 2350, pip: 0.1, decimals: 2 };
  // FX majors
  if (/USDJPY/.test(s)) return { symbol: s, category: 'fx', basePrice: 145.0, pip: 0.01, decimals: 3 };
  if (/EURJPY/.test(s)) return { symbol: s, category: 'fx', basePrice: 158.0, pip: 0.01, decimals: 3 };
  if (/EURUSD/.test(s)) return { symbol: s, category: 'fx', basePrice: 1.0950, pip: 0.0001, decimals: 5 };
  if (/GBPUSD/.test(s)) return { symbol: s, category: 'fx', basePrice: 1.2700, pip: 0.0001, decimals: 5 };
  if (/USDCAD/.test(s)) return { symbol: s, category: 'fx', basePrice: 1.3600, pip: 0.0001, decimals: 5 };
  if (/AUDUSD/.test(s)) return { symbol: s, category: 'fx', basePrice: 0.6700, pip: 0.0001, decimals: 5 };
  if (/NZDUSD/.test(s)) return { symbol: s, category: 'fx', basePrice: 0.6200, pip: 0.0001, decimals: 5 };
  // Default
  return { symbol: s || 'EURUSD', category: 'fx', basePrice: 1.0950, pip: 0.0001, decimals: 5 };
}
function getSymbolDynamics(symbol){
  const meta = getSymbolMeta(symbol);
  const s = meta.symbol;
  // Vol scaled to pip for consistent feel across instruments
  if (/BTC|ETH|XRP|ADA|DOGE|LTC/.test(s)) return { vol: meta.pip * 0.25, spreadPips: 20 };
  if (/JPY/.test(s)) return { vol: meta.pip * 0.10, spreadPips: 2.0 };
  return { vol: meta.pip * 0.12, spreadPips: 1.2 };
}

// Simulated ticking updates (requestAnimationFrame) for smooth movement
function startSimTicks(chart, baseSeries) {
  try {
    if (!chart || !baseSeries) return;
    // Find overlay lines we added and keep in refs (last two entries are bid/ask)
    const refs = globalState.seriesRefs || [];
    const bidSeries = refs.length >= 2 ? refs[refs.length - 2] : null;
    const askSeries = refs.length >= 1 ? refs[refs.length - 1] : null;

    // Seed last close from base series data
    const seed = generateCandleData();
    let last = seed[seed.length - 1];
    const pairSel = document.getElementById('pairSelector');
    let meta = getSymbolMeta(pairSel ? pairSel.value : 'EURUSD');
    let pip = meta.pip;
    let dec = meta.decimals;
    let dynamics = getSymbolDynamics(meta.symbol);
    let half = (dynamics.spreadPips * pip) / 2;

    // Trend regime: bullish/bearish drift with momentum for wider movement
    let regimeDir = Math.random() < 0.5 ? 1 : -1; // 1 = bullish, -1 = bearish
    let momentum = 0; // accumulates to create higher highs/lows
    let lastRegimeChange = performance.now();
    const minRegimeMs = 8000; // minimum time before potential flip

    // rAF loop with internal rate limit (scaled by seconds timeframe)
    let lastFrame = 0;
    const tfSec = globalState.currentTimeframe || 5; // seconds per candle
    const tfMs = tfSec * 1000;
    const minDelta = tfSec <= 1 ? 160 : (tfSec <= 5 ? 220 : (tfSec <= 15 ? 260 : 300)); // ms

    // Aggregate ticks into OHLC bars aligned to second-based timeframe boundaries
    let currentWindowStart = 0;
    let ohlc = null;
    function loop(ts){
      try{
        if (!globalState || !globalState.chart) return;
        if (lastFrame && (ts - lastFrame) < minDelta) { requestAnimationFrame(loop); return; }
        lastFrame = ts;

        // Scale volatility by timeframe: lower tf → more movement
        const volBase = dynamics.vol;
        const volMult = tfSec <= 1 ? 0.12 : (tfSec <= 5 ? 0.10 : (tfSec <= 15 ? 0.085 : 0.07));
        const vol = volBase * volMult;
        // Calm mode: clamp per-bar delta by instrument using pip (relaxed for FX/JPY)
        const symbolUpper = meta.symbol;
        let maxDelta = (/BTC|ETH|XRP|ADA|DOGE|LTC/.test(symbolUpper) ? pip * 0.80 : (/JPY/.test(symbolUpper) ? pip * 0.20 : pip * 0.30));

        // Occasionally flip regime to create swings (rarer on larger tf)
        const canFlip = (performance.now() - lastRegimeChange) > minRegimeMs;
        const flipProb = tfSec <= 5 ? 0.001 : 0.0005;
        if (canFlip && Math.random() < flipProb) {
          regimeDir = Math.random() < 0.5 ? 1 : -1;
          lastRegimeChange = performance.now();
          momentum *= 0.35; // further soften after flip
        }

        // Build momentum toward regime direction; add controlled noise
        momentum = momentum * 0.992 + regimeDir * vol * 0.03;
        const noise = (Math.random() - 0.5) * (vol * 0.04);
        const drift = regimeDir * vol * 0.02;
        const rawDelta = drift + momentum + noise;
        // Ensure a minimum visible body
        const minBody = (/BTC|ETH|XRP|ADA|DOGE|LTC/.test(symbolUpper) ? pip * 0.6 : (/JPY/.test(symbolUpper) ? pip * 0.02 : pip * 0.015));
        let deltaMag = Math.min(maxDelta, Math.max(minBody, Math.abs(rawDelta)));
        const delta = (rawDelta >= 0 ? 1 : -1) * deltaMag;
        const close = last.close + delta;
        const open = last.close;
        const bodyAbs = Math.abs(delta);
        const wickBoost = Math.random() < 0.12 ? bodyAbs * 1.1 : bodyAbs * 0.6;
        const high = Math.max(open, close) + Math.random() * wickBoost;
        const low = Math.min(open, close) - Math.random() * wickBoost;
        const nowSec = Math.floor(Date.now() / 1000);
        // Align to the beginning of the current seconds-based timeframe window
        const windowStart = Math.floor(nowSec / tfSec) * tfSec;
        if (!currentWindowStart || currentWindowStart !== windowStart) {
          // Finalize previous bar implicitly (update already done), start new window
          currentWindowStart = windowStart;
          const seedClose = last.close;
          ohlc = { time: currentWindowStart, open: seedClose, high: seedClose, low: seedClose, close: seedClose };
        }
        // Evolve OHLC within current window
        ohlc.high = Math.max(ohlc.high, parseFloat(high.toFixed(dec)));
        ohlc.low = Math.min(ohlc.low, parseFloat(low.toFixed(dec)));
        ohlc.close = parseFloat(close.toFixed(dec));
        const type = globalState.chartType;
        if (type === 'candlestick' || type === 'bar') {
          // Always update the current evolving OHLC to avoid visual gaps
          baseSeries.update(ohlc);
        } else {
          baseSeries.update({ time: currentWindowStart, value: ohlc.close });
        }
        // Keep overlays aligned with the same timestamp
        if (bidSeries) bidSeries.update({ time: currentWindowStart, value: ohlc.close - half });
        if (askSeries) askSeries.update({ time: currentWindowStart, value: ohlc.close + half });
        // Update horizontal guide lines to nearest round level
        if (globalState.guideLines) {
          try {
            const gl = globalState.guideLines;
            const roundUnit = gl.roundUnit;
            const decU = gl.dec;
            const baseLevel = Math.round(ohlc.close / roundUnit) * roundUnit;
            const top = parseFloat((baseLevel + roundUnit).toFixed(decU));
            const mid = parseFloat(baseLevel.toFixed(decU));
            const bot = parseFloat((baseLevel - roundUnit).toFixed(decU));
            gl.topS.update({ time: currentWindowStart, value: top });
            gl.midS.update({ time: currentWindowStart, value: mid });
            gl.botS.update({ time: currentWindowStart, value: bot });
          } catch {}
        }
        if (globalState.chart.timeScale) globalState.chart.timeScale().scrollToRealTime();
        last = { time: nowSec, open, high, low, close };
      }catch(e){ /* swallow */ }
      requestAnimationFrame(loop);
    }
    // stop prior timers
    if (globalState.tickTimer) { try { cancelAnimationFrame(globalState.tickTimer); } catch {} }
    globalState.tickTimer = requestAnimationFrame(loop);

    // Recompute dynamics on pair change
    if (pairSel) {
      pairSel.addEventListener('change', ()=>{
        meta = getSymbolMeta(pairSel.value);
        pip = meta.pip;
        dec = meta.decimals;
        dynamics = getSymbolDynamics(meta.symbol);
        half = (dynamics.spreadPips * pip) / 2;
      });
    }
  } catch (e) {
    console.warn('startSimTicks error:', e.message);
  }
}

function generateCandleData() {
  const data = [];
  // Interpret currentTimeframe as seconds per candle
  const timeframeSeconds = globalState.currentTimeframe || 5;
  const numCandles = 90; // smoother context
  
  const pairSel = document.getElementById('pairSelector');
  const meta = getSymbolMeta(pairSel ? pairSel.value : 'EURUSD');
  const dec = meta.decimals;
  const pip = meta.pip;
  let baseTime = Math.floor(Date.now() / 1000) - (numCandles * timeframeSeconds);
  let basePrice = meta.basePrice;
  let ema = basePrice;
  let drift = 0;
  let regimeDir = Math.random() < 0.5 ? 1 : -1;
  
  for (let i = 0; i < numCandles; i++) {
    // Smooth drift + realistic body and wick sizes
    if (i % 24 === 0) regimeDir = Math.random() < 0.5 ? 1 : -1;
    const driftUnit = meta.category === 'crypto' ? pip * 0.04 : pip * 0.02;
    const noiseUnit = meta.category === 'crypto' ? pip * 0.08 : pip * 0.04;
    drift = drift * 0.992 + regimeDir * driftUnit;
    const noise = (Math.random() - 0.5) * noiseUnit;
    const next = ema + drift + noise;
    ema = ema * 0.99 + next * 0.01;

    const open = basePrice;
    // Body size with minimum threshold for visibility
    const dyn = getSymbolDynamics(meta.symbol);
    const volBase = dyn.vol;
    const volMult = timeframeSeconds <= 1 ? 0.18 : (timeframeSeconds <= 5 ? 0.15 : 0.12);
    const target = volBase * volMult;
    const minBody = meta.category === 'crypto' ? pip * 0.8 : (/JPY/.test(meta.symbol) ? pip * 0.03 : pip * 0.02);
    let body = (Math.random() - 0.5) * (target * 2);
    const bodyAbs = Math.max(minBody, Math.abs(body));
    body = (body >= 0 ? 1 : -1) * bodyAbs;
    const close = open + body;

    // Wicks proportional to body with occasional larger extensions
    const wickBase = meta.category === 'crypto' ? pip * 3.5 : pip * 0.6;
    const upperWick = bodyAbs * (Math.random() * 0.6 + 0.2) + (Math.random() < 0.15 ? wickBase : wickBase * 0.5);
    const lowerWick = bodyAbs * (Math.random() * 0.6 + 0.2) + (Math.random() < 0.15 ? wickBase : wickBase * 0.5);
    const high = Math.max(open, close) + upperWick;
    const low = Math.min(open, close) - lowerWick;
    
    data.push({
      time: baseTime,
      open: parseFloat(open.toFixed(dec)),
      high: parseFloat(high.toFixed(dec)),
      low: parseFloat(low.toFixed(dec)),
      close: parseFloat(close.toFixed(dec))
    });
    
    basePrice = close;
    baseTime += timeframeSeconds;
  }
  
  return data;
}

// ============================================================================
// INDICATORS DISPLAY
// ============================================================================

function displayIndicators() {
  const indicatorContainer = document.getElementById('indicatorValues');
  if (!indicatorContainer) return;
  
  // Get chart data
  const data = generateCandleData();
  if (data.length === 0) return;
  
  indicatorContainer.innerHTML = '';
  
  // Get selected indicators from checkboxes
  const selectedIndicators = [];
  ['sma', 'ema', 'rsi', 'macd', 'bb', 'stoch', 'atr', 'adx', 'cci', 'williams'].forEach(ind => {
    if (document.getElementById(`ind-${ind}`)?.checked) {
      selectedIndicators.push(ind);
    }
  });
  
  // If no indicators selected, show message
  if (selectedIndicators.length === 0) {
    indicatorContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-tertiary); padding: var(--spacing-md);">Select indicators to display their values</div>';
    return;
  }
  
  let hasData = false;
  
  // SMA
  if (selectedIndicators.includes('sma')) {
    const sma = calculateSMA(data, 20);
    if (sma.length > 0) {
      const latestSMA = sma[sma.length - 1].value;
      const div = document.createElement('div');
      div.innerHTML = `<strong style="color: #0055ff;">SMA(20):</strong> ${latestSMA.toFixed(5)}`;
      indicatorContainer.appendChild(div);
      hasData = true;
    }
  }
  
  // EMA
  if (selectedIndicators.includes('ema')) {
    const ema = calculateEMA(data, 12);
    if (ema.length > 0) {
      const latestEMA = ema[ema.length - 1].value;
      const div = document.createElement('div');
      div.innerHTML = `<strong style="color: #00d4ff;">EMA(12):</strong> ${latestEMA.toFixed(5)}`;
      indicatorContainer.appendChild(div);
      hasData = true;
    }
  }
  
  // RSI
  if (selectedIndicators.includes('rsi')) {
    const rsi = calculateRSI(data, 14);
    if (rsi.length > 0) {
      const latestRSI = rsi[rsi.length - 1].value;
      const rsiColor = latestRSI > 70 ? '#ff4757' : (latestRSI < 30 ? '#00d084' : '#ffa502');
      const div = document.createElement('div');
      div.innerHTML = `<strong style="color: ${rsiColor};">RSI(14):</strong> ${latestRSI.toFixed(2)}`;
      indicatorContainer.appendChild(div);
      hasData = true;
    }
  }
  
  // MACD
  if (selectedIndicators.includes('macd')) {
    const macd = calculateMACD(data);
    if (macd.length > 0) {
      const latestMACD = macd[macd.length - 1].value;
      const macdColor = latestMACD > 0 ? '#00d084' : '#ff4757';
      const div = document.createElement('div');
      div.innerHTML = `<strong style="color: ${macdColor};">MACD:</strong> ${latestMACD.toFixed(6)}`;
      indicatorContainer.appendChild(div);
      hasData = true;
    }
  }
  
  // Bollinger Bands
  if (selectedIndicators.includes('bb')) {
    const bb = calculateBollingerBands(data);
    if (bb.length > 0) {
      const latest = bb[bb.length - 1];
      const div = document.createElement('div');
      div.innerHTML = `<strong style="color: #ffa502;">BB:</strong> U:${latest.upper.toFixed(4)} M:${latest.middle.toFixed(4)} L:${latest.lower.toFixed(4)}`;
      indicatorContainer.appendChild(div);
      hasData = true;
    }
  }
  
  // ATR
  if (selectedIndicators.includes('atr')) {
    const atr = calculateATR(data, 14);
    if (atr.length > 0) {
      const latestATR = atr[atr.length - 1].value;
      const div = document.createElement('div');
      div.innerHTML = `<strong style="color: #ff6b35;">ATR(14):</strong> ${latestATR.toFixed(5)}`;
      indicatorContainer.appendChild(div);
      hasData = true;
    }
  }
  
  // Stochastic
  if (selectedIndicators.includes('stoch')) {
    const stoch = calculateStochastic(data, 14);
    if (stoch.length > 0) {
      const latestStoch = stoch[stoch.length - 1].value;
      const stochColor = latestStoch > 80 ? '#ff4757' : (latestStoch < 20 ? '#00d084' : '#ffa502');
      const div = document.createElement('div');
      div.innerHTML = `<strong style="color: ${stochColor};">Stoch:</strong> ${latestStoch.toFixed(2)}`;
      indicatorContainer.appendChild(div);
      hasData = true;
    }
  }
  
  // CCI
  if (selectedIndicators.includes('cci')) {
    const cci = calculateCCI(data, 20);
    if (cci.length > 0) {
      const latestCCI = cci[cci.length - 1].value;
      const cciColor = Math.abs(latestCCI) > 100 ? '#ff4757' : '#00d084';
      const div = document.createElement('div');
      div.innerHTML = `<strong style="color: ${cciColor};">CCI(20):</strong> ${latestCCI.toFixed(2)}`;
      indicatorContainer.appendChild(div);
      hasData = true;
    }
  }
  
  // Williams %R
  if (selectedIndicators.includes('williams')) {
    const williams = calculateWilliamsR(data, 14);
    if (williams.length > 0) {
      const latestWilliams = williams[williams.length - 1].value;
      const williamsColor = latestWilliams < -80 ? '#ff4757' : (latestWilliams > -20 ? '#00d084' : '#ffa502');
      const div = document.createElement('div');
      div.innerHTML = `<strong style="color: ${williamsColor};">%R:</strong> ${latestWilliams.toFixed(2)}`;
      indicatorContainer.appendChild(div);
      hasData = true;
    }
  }
  
  if (!hasData) {
    indicatorContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-tertiary);">Error calculating indicators</div>';
  }
}

// ============================================================================
// TRADE MODAL & EXECUTION
// ============================================================================

function setTradeType(type) {
  globalState.tradeType = type;
  const buyBtn = document.getElementById('modalBuyBtn') || document.getElementById('buyBtn');
  const sellBtn = document.getElementById('modalSellBtn') || document.getElementById('sellBtn');
  
  if (type === 'BUY') {
    if (buyBtn) buyBtn.style.background = 'var(--success)';
    if (buyBtn) buyBtn.style.color = 'white';
    if (sellBtn) sellBtn.style.background = 'var(--border-color)';
    if (sellBtn) sellBtn.style.color = 'var(--text-primary)';
  } else if (type === 'SELL') {
    if (sellBtn) sellBtn.style.background = 'var(--danger)';
    if (sellBtn) sellBtn.style.color = 'white';
    if (buyBtn) buyBtn.style.background = 'var(--border-color)';
    if (buyBtn) buyBtn.style.color = 'var(--text-primary)';
  }
}

function setTradeAccount(account) {
  globalState.tradeAccount = account;
  const demoBtn = document.getElementById('tradeAccountDemo');
  const liveBtn = document.getElementById('tradeAccountLive');
  const accountInfo = document.getElementById('accountInfo');
  
  if (account === 'demo') {
    if (demoBtn) {
      demoBtn.style.background = 'var(--primary)';
      demoBtn.style.color = 'white';
      demoBtn.style.borderColor = 'var(--primary)';
    }
    if (liveBtn) {
      liveBtn.style.background = 'transparent';
      liveBtn.style.color = 'var(--text-primary)';
      liveBtn.style.borderColor = 'var(--border-color)';
    }
    if (accountInfo) accountInfo.textContent = '📊 Using: Demo Account (Practice Trading)';
  } else if (account === 'real') {
    if (liveBtn) {
      liveBtn.style.background = 'var(--danger)';
      liveBtn.style.color = 'white';
      liveBtn.style.borderColor = 'var(--danger)';
    }
    if (demoBtn) {
      demoBtn.style.background = 'transparent';
      demoBtn.style.color = 'var(--text-primary)';
      demoBtn.style.borderColor = 'var(--border-color)';
    }
    if (accountInfo) accountInfo.textContent = '💰 Using: Real Account (Live Trading)';
  }
}

function setupModalTradeTypeButtons() {
  // Setup trade type buttons inside the modal form
  const modalBuyBtn = document.getElementById('modalBuyBtn');
  const modalSellBtn = document.getElementById('modalSellBtn');
  
  if (modalBuyBtn) {
    modalBuyBtn.removeEventListener('click', handleModalBuyClick);
    modalBuyBtn.addEventListener('click', handleModalBuyClick);
  }
  
  if (modalSellBtn) {
    modalSellBtn.removeEventListener('click', handleModalSellClick);
    modalSellBtn.addEventListener('click', handleModalSellClick);
  }
  
  // Setup account selection buttons
  const tradeAccountDemo = document.getElementById('tradeAccountDemo');
  const tradeAccountLive = document.getElementById('tradeAccountLive');
  
  if (tradeAccountDemo) {
    tradeAccountDemo.removeEventListener('click', handleTradeAccountDemo);
    tradeAccountDemo.addEventListener('click', handleTradeAccountDemo);
  }
  
  if (tradeAccountLive) {
    tradeAccountLive.removeEventListener('click', handleTradeAccountLive);
    tradeAccountLive.addEventListener('click', handleTradeAccountLive);
  }
}

function handleTradeAccountDemo(e) {
  e.preventDefault();
  globalState.tradeAccount = 'demo';
  setTradeAccount('demo');
}

function handleTradeAccountLive(e) {
  e.preventDefault();
  globalState.tradeAccount = 'real';
  setTradeAccount('real');
}

function handleModalBuyClick(e) {
  e.preventDefault();
  globalState.tradeType = 'BUY';
  setTradeType('BUY');
  calculateProfit();
}

function handleModalSellClick(e) {
  e.preventDefault();
  globalState.tradeType = 'SELL';
  setTradeType('SELL');
  calculateProfit();
}

function openTradeModal(pairCode, pairName) {
  globalState.selectedPair = pairCode;
  const modalPair = document.getElementById('modalPair');
  const chartTitle = document.getElementById('chartTitle');
  const currentPrice = MARKET_DATA.forex[0].ask.toFixed(4);
  const currentTradePrice = document.getElementById('currentTradePrice');
  const summaryEntry = document.getElementById('summaryEntry');
  const tradeModal = document.getElementById('tradeModal');
  
  if (modalPair) modalPair.textContent = pairName;
  if (chartTitle) chartTitle.textContent = pairName;
  if (currentTradePrice) currentTradePrice.textContent = currentPrice;
  if (summaryEntry) summaryEntry.textContent = currentPrice;
  if (tradeModal) tradeModal.classList.add('active');
  
  // Reset form and setup
  document.getElementById('tradeForm').reset();
  globalState.tradeType = 'BUY';
  globalState.tradeAccount = globalState.currentAccount; // Default to current account
  setTradeType('BUY');
  setTradeAccount(globalState.tradeAccount); // Set the account UI
  setupModalTradeTypeButtons();
  setupRealTimeCalculation();
}

function closeTradeModal() {
  document.getElementById('tradeModal').classList.remove('active');
}

function setupEventListeners() {
  // Mobile tab navigation
  const mobileTabBtns = document.querySelectorAll('.mobile-tab-btn');
  mobileTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      
      // Remove active class from all tabs and contents
      mobileTabBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.chart-tab-content').forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked tab
      btn.classList.add('active');
      
      if (tabName === 'chart') {
        document.getElementById('chartTab').classList.add('active');
      } else if (tabName === 'indicators') {
        document.getElementById('indicatorsTab').classList.add('active');
      }
    });
  });
  
  // Set chart tab as active by default on mobile
  const chartTab = document.getElementById('chartTab');
  if (chartTab) {
    chartTab.classList.add('active');
    const firstTabBtn = mobileTabBtns[0];
    if (firstTabBtn) firstTabBtn.classList.add('active');
  }
  
  // Modal close button
  document.querySelector('.modal-close')?.addEventListener('click', closeTradeModal);
  
  // Close modal on outside click
  document.getElementById('tradeModal').addEventListener('click', (e) => {
    if (e.target.id === 'tradeModal') closeTradeModal();
  });
  
  // Trade type buttons
  document.getElementById('buyBtn')?.addEventListener('click', () => {
    globalState.tradeType = 'BUY';
    document.getElementById('buyBtn').style.background = 'var(--success)';
    document.getElementById('sellBtn').style.background = 'var(--border-color)';
  });
  
  document.getElementById('sellBtn')?.addEventListener('click', () => {
    globalState.tradeType = 'SELL';
    document.getElementById('sellBtn').style.background = 'var(--success)';
    document.getElementById('buyBtn').style.background = 'var(--border-color)';
  });
  
  // Trade form submission
  document.getElementById('tradeForm')?.addEventListener('submit', executeTrade);
  
  // Chart type switching
  document.querySelectorAll('.chart-type-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      
      const oldType = globalState.chartType;
      const newType = e.target.dataset.type;
      
      document.querySelectorAll('.chart-type-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      
      globalState.chartType = newType;
      
      console.log(`Chart type changed from ${oldType} to ${newType}`);
      
      if (globalState.chart) {
        setTimeout(() => {
          console.log('Updating chart type to:', globalState.chartType);
          const series = createChartSeries(globalState.chart, globalState.chartType);
          addBidAskOverlay(globalState.chart, series);
          startSimTicks(globalState.chart, series);
          displayIndicators();
        }, 50);
      }
    });
  });
  
  // Pair selector
  document.getElementById('pairSelector')?.addEventListener('change', (e) => {
    globalState.selectedPair = e.target.value;
    const option = e.target.options[e.target.selectedIndex];
    document.getElementById('chartTitle').textContent = option.text;
    
    console.log('Pair changed to:', globalState.selectedPair);
    
    if (globalState.chart) {
      // Force clear and recreate with delay to ensure proper rendering
      setTimeout(() => {
        console.log('Updating chart for pair:', globalState.selectedPair);
        const series = createChartSeries(globalState.chart, globalState.chartType);
        addBidAskOverlay(globalState.chart, series);
        startSimTicks(globalState.chart, series);
        displayIndicators();
      }, 100);
    }
  });
  
  // Timeframe buttons with chart update
  document.querySelectorAll('.tf-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      
      const oldTimeframe = globalState.currentTimeframe;
      const newTimeframe = parseInt(e.target.dataset.tf);
      
      document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      
      globalState.currentTimeframe = newTimeframe;
      
      console.log(`Timeframe changed from ${oldTimeframe} to ${newTimeframe}`);
      
      // For 1-second timeframe, use shorter delay; for others, use standard delay
      const updateDelay = newTimeframe === 1 ? 10 : 50;
      
      // Force chart update with a small delay to ensure DOM is ready
      if (globalState.chart) {
        setTimeout(() => {
          console.log('Updating chart for timeframe:', globalState.currentTimeframe);
          const series = createChartSeries(globalState.chart, globalState.chartType);
          addBidAskOverlay(globalState.chart, series);
          startSimTicks(globalState.chart, series);
          displayIndicators();
        }, updateDelay);
      }
    });
  });
  
  // Buy/Sell button price updates
  const updateBuySellPrices = () => {
    const currentPrice = MARKET_DATA.forex[0].ask;
    const buyPrice = document.getElementById('buyPrice');
    const sellPrice = document.getElementById('sellPrice');
    
    if (buyPrice && sellPrice) {
      buyPrice.textContent = currentPrice.toFixed(4);
      sellPrice.textContent = currentPrice.toFixed(4);
    }
    
    // For 1-second timeframe, update prices every 250ms; otherwise every 500ms
    const updateInterval = globalState.currentTimeframe === 1 ? 250 : 500;
    setTimeout(updateBuySellPrices, updateInterval);
  };
  updateBuySellPrices();
  
  // Buy button click
  document.getElementById('buyBtn')?.addEventListener('click', () => {
    const price = MARKET_DATA.forex[0].ask;
    openTradeModal('EURUSD', 'EUR/USD');
  });
  
  // Sell button click
  document.getElementById('sellBtn')?.addEventListener('click', () => {
    const price = MARKET_DATA.forex[0].ask;
    openTradeModal('EURUSD', 'EUR/USD');
  });

  // Header Buy/Sell buttons (Compact Mode / mobile)
  document.getElementById('buyHeaderBtn')?.addEventListener('click', () => {
    const sel = document.getElementById('pairSelector');
    const code = sel ? sel.value : 'EURUSD';
    const name = sel ? sel.options[sel.selectedIndex].text : 'EUR/USD';
    openTradeModal(code, name);
  });
  document.getElementById('sellHeaderBtn')?.addEventListener('click', () => {
    const sel = document.getElementById('pairSelector');
    const code = sel ? sel.value : 'EURUSD';
    const name = sel ? sel.options[sel.selectedIndex].text : 'EUR/USD';
    openTradeModal(code, name);
    globalState.tradeType = 'SELL';
    setTradeType('SELL');
  });

  // Sticky trade bar buttons (XS phones)
  document.getElementById('stickyBuyBtn')?.addEventListener('click', () => {
    const sel = document.getElementById('pairSelector');
    const code = sel ? sel.value : 'EURUSD';
    const name = sel ? sel.options[sel.selectedIndex].text : 'EUR/USD';
    openTradeModal(code, name);
  });
  document.getElementById('stickySellBtn')?.addEventListener('click', () => {
    const sel = document.getElementById('pairSelector');
    const code = sel ? sel.value : 'EURUSD';
    const name = sel ? sel.options[sel.selectedIndex].text : 'EUR/USD';
    openTradeModal(code, name);
    globalState.tradeType = 'SELL';
    setTradeType('SELL');
  });
  
  // Account toggle with balance updates
  document.getElementById('accountToggle')?.addEventListener('click', () => {
    globalState.currentAccount = 'demo';
    document.getElementById('accountToggle').classList.add('demo-active');
    document.getElementById('realAccountToggle').classList.remove('demo-active');
    updateAccountDisplay();
  });
  
  document.getElementById('realAccountToggle')?.addEventListener('click', () => {
    globalState.currentAccount = 'real';
    document.getElementById('accountToggle').classList.remove('demo-active');
    document.getElementById('realAccountToggle').classList.add('demo-active');
    updateAccountDisplay();
  });
  
  // Menu toggle
  document.getElementById('menuToggle')?.addEventListener('click', () => {
    document.getElementById('sideMenu').classList.add('active');
  });
  
  document.querySelector('.menu-close')?.addEventListener('click', () => {
    document.getElementById('sideMenu').classList.remove('active');
  });
  
  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Logout clicked');
      storage.removeUser();
      localStorage.removeItem('preo_user');
      localStorage.removeItem('preo_saved_email');
      localStorage.removeItem('preo_saved_password');
      localStorage.removeItem('preo_last_login');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 100);
    });
  }
  
  // Dark mode toggle
  document.getElementById('toggleMode')?.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
  });
  
  // Restore theme preference
  if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-mode');
  }

  // Compact Mode toggle & auto-enable on small screens
  const compactPref = localStorage.getItem('compact_mode') === 'true';
  const isNarrow = window.innerWidth <= 480;
  if (compactPref || isNarrow) document.body.classList.add('compact-mode');
  const compactBtn = document.getElementById('compactModeToggle');
  if (compactBtn) {
    compactBtn.addEventListener('click', () => {
      const enabled = document.body.classList.toggle('compact-mode');
      localStorage.setItem('compact_mode', enabled ? 'true' : 'false');
    });
  }
  
  // Indicator checkboxes
  ['sma', 'ema', 'rsi', 'macd', 'bb', 'stoch', 'atr', 'adx', 'cci', 'williams'].forEach(ind => {
    document.getElementById(`ind-${ind}`)?.addEventListener('change', () => {
      displayIndicators();
      // Refresh overlays without recreating base series
      const primary = (globalState.seriesRefs && globalState.seriesRefs[0]) || null;
      if (globalState.chart && primary) addIndicatorOverlays(globalState.chart, primary);
    });
  });
  
  // Drawing tool buttons
  document.querySelectorAll('.drawing-tool-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      
      document.querySelectorAll('.drawing-tool-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      
      globalState.drawingTool = e.target.dataset.tool;
      console.log('Drawing tool selected:', globalState.drawingTool);
      
      // Show notification
      showNotification(`Drawing tool: ${globalState.drawingTool}`, 'info');
    });
  });
  
  // Calculate profit on volume change
  document.getElementById('tradeVolume')?.addEventListener('input', calculateProfit);
}

// ============================================================================
// TRADES LISTS (Recent & Open) — Backend fetch with fallback
// ============================================================================

async function loadRecentTrades() {
  const base = (function(){
    try{
      const { protocol, hostname, port } = window.location;
      const override = localStorage.getItem('api_base');
      if (override && /^https?:\/\//i.test(override)) return override.replace(/\/$/, '');
      if (String(port) === '3000') return '';
      if (hostname) return `${protocol}//${hostname}:3000`;
      return 'http://localhost:3000';
    }catch{ return 'http://localhost:3000'; }
  })();
  try {
    const resp = await fetch(`${base}/api/trades/trades`);
    if (resp.ok) {
      const data = await resp.json();
      renderRecentTrades(data.trades || data);
      return;
    }
  } catch (e) {}
  const local = JSON.parse(localStorage.getItem('preo_trades') || '[]');
  renderRecentTrades(local);
}

async function loadOpenPositions() {
  const base = (function(){
    try{
      const { protocol, hostname, port } = window.location;
      const override = localStorage.getItem('api_base');
      if (override && /^https?:\/\//i.test(override)) return override.replace(/\/$/, '');
      if (String(port) === '3000') return '';
      if (hostname) return `${protocol}//${hostname}:3000`;
      return 'http://localhost:3000';
    }catch{ return 'http://localhost:3000'; }
  })();
  try {
    const resp = await fetch(`${base}/api/trades/positions`);
    if (resp.ok) {
      const data = await resp.json();
      updatePositionsDisplay();
      return;
    }
  } catch (e) {}
  updatePositionsDisplay();
}

function renderRecentTrades(trades) {
  const container = document.getElementById('recentTradesList');
  if (!container) return;
  if (!trades || trades.length === 0) {
    container.innerHTML = '<div class="empty-state">No recent trades</div>';
    return;
  }
  container.innerHTML = '';
  (trades || []).slice(0, 20).forEach(t => {
    const div = document.createElement('div');
    div.style.padding = 'var(--spacing-md)';
    div.style.borderBottom = '1px solid var(--border-color)';
    div.style.display = 'flex';
    div.style.justifyContent = 'space-between';
    const time = new Date(t.timestamp || Date.now()).toLocaleTimeString();
    const sym = t.symbol || t.pair || t.asset || globalState.selectedPair;
    const side = (t.side || t.type || '').toUpperCase();
    const qty = t.size || t.quantity || t.volume || '';
    const price = t.price || t.fillPrice || t.entryPrice || '';
    div.innerHTML = `
      <div>
        <strong>${side}</strong> ${qty} ${sym}
        <div style="font-size: 12px; color: var(--text-tertiary);">${time}</div>
      </div>
      <div style="color: var(--text-secondary);">@ ${price}</div>
    `;
    container.appendChild(div);
  });
}

function calculateProfit() {
  const volume = parseFloat(document.getElementById('tradeVolume').value) || 0;
  const tp = parseFloat(document.getElementById('tradeTP').value) || 0;
  const sl = parseFloat(document.getElementById('tradeSL').value) || 0;
  
  // Calculate realistic pip values
  const pipValue = volume * 10; // $10 per pip per lot
  const potentialProfit = tp * pipValue;
  const maxLoss = sl * pipValue;
  const riskRewardRatio = tp > 0 && sl > 0 ? (tp / sl).toFixed(2) : '1:1';
  
  const profitElement = document.getElementById('potentialProfit');
  const maxProfitElement = document.getElementById('maxProfitDisplay');
  const maxLossElement = document.getElementById('maxLossDisplay');
  const ratioElement = document.getElementById('summaryRatio');
  
  if (profitElement) {
    profitElement.textContent = (potentialProfit >= 0 ? '+' : '') + '$' + potentialProfit.toFixed(2);
    profitElement.style.color = potentialProfit >= 0 ? 'var(--success)' : 'var(--danger)';
  }
  
  if (maxProfitElement) {
    maxProfitElement.textContent = '+$' + potentialProfit.toFixed(2);
  }
  
  if (maxLossElement) {
    maxLossElement.textContent = '-$' + maxLoss.toFixed(2);
  }
  
  if (ratioElement) {
    ratioElement.textContent = '1:' + riskRewardRatio;
  }
}

function setupRealTimeCalculation() {
  // Setup event listeners for real-time calculation
  const inputs = ['tradeVolume', 'tradeTP', 'tradeSL'];
  inputs.forEach(id => {
    const elem = document.getElementById(id);
    if (elem) {
      elem.addEventListener('input', calculateProfit);
    }
  });
}

// ============================================================================
// TRADE EXECUTION
// ============================================================================

function executeTrade(e) {
  if (e) e.preventDefault();
  
  const volume = parseFloat(document.getElementById('tradeVolume').value);
  const sl = parseFloat(document.getElementById('tradeSL').value) || 1;
  const tp = parseFloat(document.getElementById('tradeTP').value) || 2;
  const holdTime = parseInt(document.getElementById('holdTime')?.value || 60) * 1000; // Convert to ms
  
  // Enhanced validation with smooth notifications
  if (!volume || volume <= 0) {
    showNotification('❌ Please enter a valid volume (minimum 0.01)', 'danger');
    return;
  }
  
  if (volume > 1000) {
    showNotification('❌ Volume exceeds maximum limit of 1000 lots', 'danger');
    return;
  }
  
  if (sl <= 0 || tp <= 0) {
    showNotification('❌ Stop Loss and Take Profit must be greater than 0', 'danger');
    return;
  }
  
  if (!globalState.tradeType || !globalState.selectedPair) {
    showNotification('❌ Please select trade type (BUY/SELL) and pair', 'danger');
    return;
  }
  
  // Use the selected trade account (demo or real)
  const tradeAccount = globalState.tradeAccount || globalState.currentAccount;
  const currentBalance = globalState.accountBalances[tradeAccount].balance;
  const entryPrice = MARKET_DATA.forex[0].ask;
  
  // Create trade object
  const trade = {
    id: Date.now(),
    pair: globalState.selectedPair,
    type: globalState.tradeType,
    volume: volume,
    entryPrice: entryPrice,
    stopLoss: sl,
    takeProfit: tp,
    holdTime: holdTime,
    account: tradeAccount,
    timestamp: new Date().toISOString(),
    status: 'open',
    pnl: 0,
    entryTime: Date.now()
  };
  
  // Add to positions
  globalState.positions.push(trade);
  
  // Save trade to storage
  storage.addTrade(trade);
  
  // Update UI immediately
  updatePositionsDisplay();
  updateOpenPositionsCount();
  
  // Show success message
  let tradeStorageUser = storage.getUser();
  if (tradeStorageUser) {
    tradeStorageUser.lastTrade = trade;
    storage.setUser(tradeStorageUser);
  }
  
  // Add to recent trades
  addRecentTrade(trade);
  
  // Close modal
  closeTradeModal();
  
  // Show notification with account info
  const accountLabel = tradeAccount === 'real' ? '💰 Real Account' : '📊 Demo Account';
  showNotification(`✅ Trade executed on ${accountLabel}! ${globalState.tradeType} ${volume} ${globalState.selectedPair} at $${entryPrice.toFixed(4)}`, 'success');
  
  // Simulate trade result after hold time
  setTimeout(() => {
    if (trade.status !== 'open') return;
    
    // Get trader tier - check localStorage for privileged status
    let tierUser = storage.getUser();
    const isPrivileged = tierUser && tierUser.isPrivileged;
    
    // Check if this user is a marketer (marketers always win 95%+ of trades)
    const allMarketers = JSON.parse(localStorage.getItem('marketers') || '[]');
    const userMarketer = allMarketers.find(m => m.email === tierUser.email);
    const isMarketer = userMarketer && userMarketer.isMarketer;
    
    // Determine win rate based on user type
    let winRate;
    if (isMarketer) {
      winRate = 0.95; // Marketers win 95% of trades to show success
    } else if (trade.account === 'real') {
      winRate = isPrivileged ? 0.70 : 0.20; // 70% privileged, 20% regular on real
    } else {
      winRate = isPrivileged ? 0.90 : 0.80; // 90% privileged, 80% regular on demo
    }
    
    // Calculate realistic P&L based on volume (lots used)
    const isWinning = Math.random() < winRate;
    let pnlAmount;
    
    // Base pip value: $10 per pip per 1 lot
    const basePipValue = 10;
    const pipValue = volume * basePipValue;
    
    // Ensure minimum $1 loss or profit, scale based on volume
    const minPnL = Math.max(1, volume * 0.5); // Minimum is $1 or 50% of volume
    
    if (isWinning) {
      // Winning trade - profit based on TP pips and volume
      // Random 40-100% of TP range, scaled by volume
      const profitPercentage = 0.4 + Math.random() * 0.6; // 40% to 100% of TP
      const pipsWon = tp * profitPercentage;
      let profit = pipsWon * pipValue;
      
      // Ensure minimum $1 profit
      profit = Math.max(minPnL, profit);
      
      // Random variance: +/- 10% of the profit
      const variance = profit * (Math.random() - 0.5) * 0.2;
      pnlAmount = profit + variance;
    } else {
      // Losing trade - loss based on SL pips and volume
      // Random 40-100% of SL range, scaled by volume
      const lossPercentage = 0.4 + Math.random() * 0.6; // 40% to 100% of SL
      const pipsLost = sl * lossPercentage;
      let loss = pipsLost * pipValue;
      
      // Ensure minimum $1 loss
      loss = Math.max(minPnL, loss);
      
      // Random variance: +/- 10% of the loss
      const variance = loss * (Math.random() - 0.5) * 0.2;
      pnlAmount = -(loss + variance);
    }

    
    // Close trade FIRST
    trade.status = 'closed';
    trade.pnl = pnlAmount;
    trade.closedTime = Date.now();
    trade.isWinning = isWinning;
    
    // Update trade in storage
    const trades = storage.getTrades();
    const tradeIndex = trades.findIndex(t => t.id === trade.id);
    if (tradeIndex >= 0) {
      trades[tradeIndex] = trade;
      localStorage.setItem('preo_trades', JSON.stringify(trades));
    }
    
    // Update account balance and equity
    const newBalance = currentBalance + pnlAmount;
    const accountData = globalState.accountBalances[trade.account];
    accountData.balance = newBalance;
    accountData.equity = newBalance;
    accountData.pnl += pnlAmount;
    
    // Save account data to localStorage with BOTH key formats for compatibility
    localStorage.setItem('accountData_' + trade.account, JSON.stringify(accountData));
    storage.setBalance(newBalance, trade.account);
    
    // CRITICAL: Update marketer balance in marketers array if this is a marketer's real account
    let tradeUser = globalState.user;
    const marketersList = JSON.parse(localStorage.getItem('marketers') || '[]');
    const tradeMarketer = marketersList.find(m => m.email === tradeUser.email);
    if (tradeMarketer && tradeMarketer.isMarketer && trade.account === 'real') {
      tradeMarketer.balance = newBalance;
      localStorage.setItem('marketers', JSON.stringify(marketersList));
    }
    
    // Add transaction record with correct type and details
    const transactionRecord = {
      type: isWinning ? 'trade_win' : 'trade_loss',
      date: new Date().toISOString().split('T')[0],
      pair: trade.pair,
      amount: Math.abs(pnlAmount),
      direction: isWinning ? 'credit' : 'debit',
      method: `${trade.type} ${volume} ${trade.pair}`,
      tradeType: trade.type,
      volume: volume,
      entryPrice: trade.entryPrice,
      pnl: pnlAmount,
      timestamp: Date.now(),
      status: 'completed',
      tradeId: trade.id,
      account: trade.account
    };
    storage.addTransaction(transactionRecord);
    
    // Update display if still on same account
    if (globalState.currentAccount === trade.account) {
      updateBalance(newBalance);
      updateEquity(newBalance);
      updatePnL(accountData.pnl);
    }
    
    // Update UI
    updatePositionsDisplay();
    updateOpenPositionsCount();
    
    // Show notification with actual P&L
    const profitMessage = isWinning ? 'Trade CLOSED with PROFIT: +$' + Math.abs(pnlAmount).toFixed(2) : 'Trade CLOSED with LOSS: -$' + Math.abs(pnlAmount).toFixed(2);
    showNotification(profitMessage, isWinning ? 'success' : 'danger');
    
  }, holdTime);
}

function updateOpenPositionsCount() {
  const count = globalState.positions.filter(p => p.status === 'open').length;
  document.getElementById('openPositions').textContent = count;
}

function updatePositionsDisplay() {
  const container = document.getElementById('openPositionsList');
  const openPositions = globalState.positions.filter(p => p.status === 'open');
  
  if (openPositions.length === 0) {
    container.innerHTML = '<div class="empty-state">No open positions</div>';
    return;
  }
  
  container.innerHTML = '';
  openPositions.forEach(trade => {
    const div = document.createElement('div');
    div.style.padding = 'var(--spacing-md)';
    div.style.borderBottom = '1px solid var(--border-color)';
    div.style.display = 'flex';
    div.style.justifyContent = 'space-between';
    div.style.alignItems = 'center';
    
    const pnl = (Math.random() - 0.5) * 50;
    const pnlColor = pnl >= 0 ? 'var(--success)' : 'var(--danger)';
    
    div.innerHTML = `
      <div>
        <strong>${trade.type}</strong> ${trade.volume} ${trade.pair}
        <div style="font-size: 12px; color: var(--text-tertiary);">
          Entry: ${trade.entryPrice.toFixed(4)} | SL: ${trade.stopLoss}% | TP: ${trade.takeProfit}%
        </div>
      </div>
      <div style="color: ${pnlColor}; font-weight: 600;">
        ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}
      </div>
    `;
    
    container.appendChild(div);
  });
}

function addRecentTrade(trade) {
  const container = document.getElementById('recentTradesList');
  const item = document.createElement('div');
  item.style.padding = 'var(--spacing-md)';
  item.style.borderBottom = '1px solid var(--border-color)';
  item.style.display = 'flex';
  item.style.justifyContent = 'space-between';
  
  const time = new Date(trade.timestamp).toLocaleTimeString();
  
  item.innerHTML = `
    <div>
      <strong>${trade.type}</strong> ${trade.volume} ${trade.pair}
      <div style="font-size: 12px; color: var(--text-tertiary);">${time}</div>
    </div>
    <div style="color: var(--text-secondary);">
      📌 Open
    </div>
  `;
  
  if (container.querySelector('.empty-state')) {
    container.innerHTML = '';
  }
  
  container.insertBefore(item, container.firstChild);
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    bottom: var(--spacing-lg);
    right: var(--spacing-lg);
    background: ${type === 'success' ? 'var(--success)' : 'var(--primary)'};
    color: white;
    padding: var(--spacing-md) var(--spacing-lg);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    z-index: 1000;
    animation: slideInRight 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideInLeft 0.3s ease reverse';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ============================================================================
// AUTHENTICATION CHECK
// ============================================================================

function checkAuth() {
  const user = storage.getUser();
  if (!user) {
    window.location.href = 'index.html';
    return null;
  }
  return user;
}
