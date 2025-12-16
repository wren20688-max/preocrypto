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
  const DEFAULT_APP_CONFIG = {
    companyName: 'PreoCrypto',
    supportEmail: 'support@example.com', // TODO: replace with your real email
    supportPhone: '+000 000 0000',       // TODO: replace with your real phone
    // Base URL for redirects/webhooks (used by PayHero)
    baseUrl: 'https://yourapp.vercel.app'
  };

  try {
    window.appConfig = Object.assign({}, DEFAULT_APP_CONFIG, window.appConfig || {});
  } catch (_) {
    window.appConfig = DEFAULT_APP_CONFIG;
  }

  // API base & helper so frontend on 5500 can call backend on 5000
  try {
    const samePort = (location.port === '5000');
    const defaultBase = `${location.protocol}//${location.hostname}:5000`;
    const savedBase = localStorage.getItem('preo_api_base');
    const configured = (typeof window.API_BASE === 'string' && window.API_BASE.length > 0) ? window.API_BASE : null;
    const base = samePort ? '' : (configured || savedBase || defaultBase);
    window.API_BASE = base; // '' when same-origin (5000), else absolute

    window.apiFetch = async function(path, options) {
      const urlPrimary = (path.startsWith('http://') || path.startsWith('https://')) ? path : (window.API_BASE || '') + path;
      try {
        return await fetch(urlPrimary, options);
      } catch (e) {
        // Fallback: try relative path (useful if backend is reverse-proxied)
        try {
          if (!(path.startsWith('http://') || path.startsWith('https://'))) {
            return await fetch(path, options);
          }
        } catch (_) {}
        throw e;
      }
    };
  } catch (_) {
    window.API_BASE = '';
    window.apiFetch = function(path, options) { return fetch(path, options); };
  }
})();
