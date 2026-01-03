const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function tryParseJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}

exports.handler = async (event) => {
  // Accept only POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method not allowed' }) };
  }

  const headers = event.headers || {};
  const bodyText = event.body || '';
  const logs = [];

  try {
    logs.push({ receivedAt: new Date().toISOString() });
    logs.push({ headersSummary: { 'x-account-id': headers['x-account-id'] || headers['X-Account-Id'] || null } });

    // If the PayHero account id is provided, check the header (best-effort)
    if (process.env.PAYHERO_ACCOUNT_ID) {
      const acct = String(process.env.PAYHERO_ACCOUNT_ID);
      const headerAcct = String(headers['x-account-id'] || headers['X-Account-Id'] || '');
      if (headerAcct && headerAcct !== acct) {
        logs.push({ warning: 'X-Account-Id mismatch', headerAcct, expected: acct });
      }
    }

    // Optional signature verification (if PayHero sends one).
    // Common header names tried: 'x-payhero-signature', 'x-signature'.
    const sigHeader = headers['x-payhero-signature'] || headers['X-Payhero-Signature'] || headers['x-signature'] || headers['X-Signature'];
    if (sigHeader && process.env.PAYHERO_SECRET_KEY) {
      try {
        const hmac = crypto.createHmac('sha256', process.env.PAYHERO_SECRET_KEY);
        hmac.update(bodyText, 'utf8');
        const digest = hmac.digest('hex');
        // Accept either raw hex or prefixed form (sha256=...)
        const ok = digest === sigHeader || `sha256=${digest}` === sigHeader;
        logs.push({ signatureCheck: ok ? 'ok' : 'failed', expected: digest, received: sigHeader });
        if (!ok) {
          return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Invalid signature', logs }) };
        }
      } catch (e) {
        logs.push({ signatureError: e.message });
      }
    } else {
      logs.push({ signature: 'skipped', reason: sigHeader ? 'no secret configured' : 'no signature header' });
    }

    // Try parse JSON payload
    let payload;
    try { payload = JSON.parse(bodyText); } catch { payload = bodyText || null; }
    logs.push({ payloadSummary: Array.isArray(payload) ? `array(${payload.length})` : (payload && typeof payload === 'object' ? 'object' : typeof payload) });

    // Optional: persist webhook to a local file when SAVE_WEBHOOKS=1 (for local/dev debugging)
    if (process.env.SAVE_WEBHOOKS === '1') {
      try {
        const savePath = path.join(__dirname, '..', '..', 'webhook_received_logs.json');
        const entry = { receivedAt: new Date().toISOString(), headers, payload };
        let arr = [];
        if (fs.existsSync(savePath)) {
          try { arr = JSON.parse(fs.readFileSync(savePath, 'utf8')) || []; } catch {}
        }
        arr.push(entry);
        fs.writeFileSync(savePath, JSON.stringify(arr, null, 2));
        logs.push({ savedTo: savePath });
      } catch (e) {
        logs.push({ saveError: e.message });
      }
    }

    // Optional: update local `db.json` when running in dev or when enabled via env
    // Controlled by UPDATE_DB_ON_WEBHOOK=1 to avoid unexpected writes in production.
    if (process.env.UPDATE_DB_ON_WEBHOOK === '1') {
      try {
        const dbPath = path.join(__dirname, '..', '..', 'db.json');
        if (fs.existsSync(dbPath)) {
          const raw = fs.readFileSync(dbPath, 'utf8');
          const db = JSON.parse(raw || '{}');
          if (!Array.isArray(db.transactions)) db.transactions = [];

          const txId = (payload && (payload.data?.id || payload.id)) || `pay_${Date.now()}`;
          const userRef = payload?.metadata?.user_id || payload?.metadata?.user_email || payload?.customer?.email || payload?.customer?.name || null;
          const amount = Number(payload?.amount || payload?.data?.amount || payload?.metadata?.original_amount || 0);
          const currency = payload?.currency || payload?.data?.currency || payload?.metadata?.currency || 'KES';
          // Heuristic: success detection
          const success = (payload && (payload.status === 'success' || payload.data?.status === 'successful' || payload.event === 'payment.succeeded' || payload?.data?.status === 'successful')) || false;

          const tx = {
            id: txId,
            username: userRef || 'unknown',
            type: 'deposit',
            method: (payload?.payment_method || payload?.metadata?.method || 'mpesa'),
            amount: amount,
            status: success ? 'completed' : (payload?.status || 'pending'),
            timestamp: new Date().toISOString(),
            raw: payload
          };

          db.transactions.push(tx);

          // Try to find the user in db.users by username or email
          const users = db.users || {};
          let foundKey = null;
          if (userRef) {
            // Direct key match
            if (users[userRef]) foundKey = userRef;
            else {
              // Search for user object with matching email or username fields
              for (const k of Object.keys(users)) {
                const u = users[k] || {};
                if ((u.email && String(u.email).toLowerCase() === String(userRef).toLowerCase()) || (u.username && String(u.username).toLowerCase() === String(userRef).toLowerCase())) {
                  foundKey = k; break;
                }
              }
            }
          }

          if (foundKey) {
            if (success && amount > 0) {
              // Only credit real accounts for real deposits
              const balanceKey = 'realBalance';
              const prev = Number(users[foundKey][balanceKey] || 0);
              users[foundKey][balanceKey] = prev + amount;
              logs.push({ balanceUpdated: { user: foundKey, balanceKey, previous: prev, new: users[foundKey][balanceKey] } });
            } else {
              logs.push({ balanceSkipped: 'not credited - not successful or zero amount', success, amount });
            }
          } else {
            logs.push({ balanceSkipped: 'user not found', userRef });
          }

          // Persist db
          fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
          logs.push({ dbUpdated: dbPath, txId, userFound: foundKey });
        } else {
          logs.push({ dbUpdateSkipped: 'db.json not found' });
        }
      } catch (e) {
        logs.push({ dbUpdateError: e.message });
      }
    }

    // At this point you would typically update a DB record to mark payment completed.
    // Optionally forward the webhook to your main server for persistent handling.
    if (process.env.FORWARD_WEBHOOK_TO_SERVER === '1') {
      try {
        const forwardUrl = process.env.WEBHOOK_FORWARD_URL || ((process.env.SITE_URL || '').replace(/\/$/, '') + '/webhook/payhero');
        const fheaders = { 'Content-Type': 'application/json' };
        // preserve signature/account headers if present
        if (headers['x-payhero-signature']) fheaders['x-payhero-signature'] = headers['x-payhero-signature'];
        if (headers['X-Payhero-Signature']) fheaders['X-Payhero-Signature'] = headers['X-Payhero-Signature'];
        if (headers['x-account-id']) fheaders['x-account-id'] = headers['x-account-id'];
        if (headers['X-Account-Id']) fheaders['X-Account-Id'] = headers['X-Account-Id'];

        const fetch = global.fetch || (await import('node-fetch')).then(m => m.default || m);
        const resp = await fetch(forwardUrl, { method: 'POST', headers: fheaders, body: bodyText });
        const text = await resp.text();
        logs.push({ forwarded: { url: forwardUrl, status: resp.status, response: tryParseJson(text) || text } });
      } catch (e) {
        logs.push({ forwardError: e.message });
      }
    }

    console.log('[mpesa-callback] payload:', payload);

    return { statusCode: 200, body: JSON.stringify({ success: true, message: 'Callback received', logs }) };
  } catch (err) {
    console.error('mpesa-callback error', err);
    return { statusCode: 500, body: JSON.stringify({ success: false, error: err.message }) };
  }
};
