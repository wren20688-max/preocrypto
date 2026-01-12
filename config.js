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
    baseUrl: (typeof window !== 'undefined' && window.location) ? window.location.origin : 'https://your-site.netlify.app',
    // Preferred API origin for local dev fallbacks
    apiOrigin: (typeof window !== 'undefined' && window.location) ? window.location.origin : 'https://your-site.netlify.app'
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
    const remoteOrigin = (window.appConfig && (window.appConfig.apiOrigin || window.appConfig.baseUrl)) || '';
    // Any localhost (including 5500) should prefer remote API to avoid missing local server
    if (isLocalhost) {
      if (remoteOrigin) {
        base = remoteOrigin;
        try { localStorage.setItem('preo_api_base', remoteOrigin); } catch (_) {}
      }
    }

    window.API_BASE = base; // '' => same-origin

    // Known Netlify function path fallbacks for when redirects fail (405/404)
    const NETLIFY_MAP = {
      '/api/auth/register': '/.netlify/functions/auth-register',
      '/api/auth/login': '/.netlify/functions/auth-login',
      '/api/auth/identify': '/.netlify/functions/auth-identify',
      '/api/user/profile': '/.netlify/functions/user-profile',
      '/api/transactions': '/.netlify/functions/transactions',
      '/api/payment/deposit': '/.netlify/functions/payment-deposit',
      '/api/payment/withdrawal': '/.netlify/functions/payment-withdrawal',
      '/api/payment/intent': '/.netlify/functions/payhero-create-intent',
      '/api/payhero/create-payment': '/.netlify/functions/payhero-create-payment',
      '/webhook/payhero': '/.netlify/functions/webhook-payhero',
      '/webhook/mpesa-callback': '/.netlify/functions/mpesa-callback',
      '/api/admin/self-test': '/.netlify/functions/admin-self-test',
      '/api/health': '/.netlify/functions/health',
      '/api/admin/reset-users': '/.netlify/functions/admin-reset-users',
      '/api/admin/users': '/.netlify/functions/admin-users',
      '/api/admin/deposits/summary': '/.netlify/functions/admin-deposits-summary',
      '/api/admin/settings': '/.netlify/functions/admin-settings',
      '/api/admin/settings/marketer-demo-win-rate': '/.netlify/functions/admin-settings-marketer-demo-win-rate',
      '/api/admin/settings/marketer-real-win-rate': '/.netlify/functions/admin-settings-marketer-real-win-rate'
    };

    window.apiFetch = async function(path, options) {
      const absolute = (path.startsWith('http://') || path.startsWith('https://'));
      const makeUrl = (b) => absolute ? path : (b || '') + path;
      let tryBases = [];
      const remote = (window.appConfig && (window.appConfig.apiOrigin || window.appConfig.baseUrl)) || '';
      // Prefer remote first when available (helps Live Server on localhost)
      if (remote) tryBases.push(remote);
      // Then current configured base
      tryBases.push(window.API_BASE || '');
      // Also include common localhost API fallbacks (ports 5000 and 3000)
      tryBases.push('http://localhost:5000');
      tryBases.push('http://127.0.0.1:5000');
      tryBases.push('http://localhost:3000');
      tryBases.push('http://127.0.0.1:3000');
      // Finally, raw path as fallback
      tryBases.push('');

      let lastErr = null;
      for (const b of tryBases) {
        const url = makeUrl(b);
        try {
          const res = await fetch(url, options);
          // Save working base for later
          if (b && res && typeof res.status === 'number' && res.ok) {
            window.API_BASE = b;
            localStorage.setItem('preo_api_base', b);
          }
          // If redirects fail (Netlify returning 404/405), retry with direct functions path if known
          if (!res.ok && (res.status === 405 || res.status === 404) && !absolute) {
            const mapped = NETLIFY_MAP[path];
            if (mapped) {
              const altUrl = (b || '') + mapped;
              try {
                const altRes = await fetch(altUrl, options);
                if (b && altRes && altRes.ok) {
                  window.API_BASE = b;
                  localStorage.setItem('preo_api_base', b);
                }
                return altRes;
              } catch (altErr) {
                lastErr = altErr;
                // continue to next base
              }
            }
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
