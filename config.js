// Global feature flags for client-side usage
// Persisted to localStorage so all clients default to enabled
(function () {
  const DEFAULT_FLAGS = {
    claudeSonnet45: true
  };

  const KEY = 'preo_feature_flags';
  const existing = localStorage.getItem(KEY);
  let flags = DEFAULT_FLAGS;
  try {
    if (existing) {
      flags = { ...DEFAULT_FLAGS, ...JSON.parse(existing) };
    } else {
      localStorage.setItem(KEY, JSON.stringify(DEFAULT_FLAGS));
    }
  } catch (_) {
    // If parsing fails, reset
    localStorage.setItem(KEY, JSON.stringify(DEFAULT_FLAGS));
  }

  window.featureFlags = {
    get(name) {
      return flags[name];
    },
    getAll() {
      return { ...flags };
    },
    set(name, value) {
      flags[name] = value;
      localStorage.setItem(KEY, JSON.stringify(flags));
    }
  };

  // Basic app config (placeholders — update to your real contacts)
  // Generate random support contacts once and persist
  function genRandomEmail() {
    const id = Math.random().toString(36).slice(2, 7);
    return `support+${id}@example.com`;
  }
  function genRandomPhone() {
    const d = () => Math.floor(Math.random() * 10);
    return `+${d()}${d()}${d()} ${d()}${d()}${d()} ${d()}${d()}${d()}${d()}`;
  }
  const CONTACTS_KEY = 'preo_support_contacts';
  let contacts = null;
  try {
    contacts = JSON.parse(localStorage.getItem(CONTACTS_KEY) || 'null');
  } catch (_) { contacts = null; }
  if (!contacts) {
    contacts = { email: genRandomEmail(), phone: genRandomPhone() };
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
  }

  const DEFAULT_APP_CONFIG = {
    companyName: 'PreoCrypto',
    supportEmail: contacts.email,
    supportPhone: contacts.phone,
    // Base URL for redirects/webhooks (used by PayHero)
    baseUrl: 'https://preocrypto.netlify.app',
    // Preferred API origin for local dev fallbacks
    apiOrigin: 'https://preocrypto.netlify.app'
  };

  try {
    window.appConfig = Object.assign({}, DEFAULT_APP_CONFIG, window.appConfig || {});
  } catch (_) {
    window.appConfig = DEFAULT_APP_CONFIG;
  }

  // API base & helper so frontend on 5500 can call backend on 5000
  try {
    const isLocalhost = ['localhost', '127.0.0.1'].includes(location.hostname);
    const isVercel = location.hostname.endsWith('.vercel.app');
    const isNetlify = location.hostname.endsWith('.netlify.app');
    const samePort = (location.port === '5000');
    const defaultBase = `${location.protocol}//${location.hostname}:5000`;
    const savedBase = localStorage.getItem('preo_api_base');
    const configured = (typeof window.API_BASE === 'string' && window.API_BASE.length > 0) ? window.API_BASE : null;

    // Prefer same-origin on hosted environments
    let base = (isVercel || isNetlify || (!isLocalhost && !samePort)) ? '' : (samePort ? '' : (configured || savedBase || defaultBase));

    // If using Live Server (port 5500) with no backend, fall back to remote API origin if provided
    if (isLocalhost && location.port === '5500') {
      const remote = (window.appConfig && (window.appConfig.apiOrigin || window.appConfig.baseUrl)) || '';
      if (remote) base = remote;
    }

    window.API_BASE = base; // '' => same-origin

    window.apiFetch = async function(path, options) {
      const absolute = (path.startsWith('http://') || path.startsWith('https://'));
      const makeUrl = (b) => absolute ? path : (b || '') + path;
      let tryBases = [];
      // Primary base first
      tryBases.push(window.API_BASE || '');
      // If primary is localhost:5000 and fails, try remote apiOrigin
      const remote = (window.appConfig && (window.appConfig.apiOrigin || window.appConfig.baseUrl)) || '';
      if (!tryBases.includes(remote)) tryBases.push(remote);
      // Also try raw path as final fallback
      if (!tryBases.includes('')) tryBases.push('');

      let lastErr = null;
      for (const b of tryBases) {
        const url = makeUrl(b);
        try {
          const res = await fetch(url, options);
          // Save working base for later
          if (b && res && typeof res.status === 'number') {
            window.API_BASE = b;
            localStorage.setItem('preo_api_base', b);
          }
          return res;
        } catch (e) {
          lastErr = e;
          continue;
        }
      }
      throw lastErr || new Error('Network error');
    };
  } catch (_) {
    window.API_BASE = '';
    window.apiFetch = function(path, options) { return fetch(path, options); };
  }
})();
