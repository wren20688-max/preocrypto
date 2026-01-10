// Use native fetch or import node-fetch
let fetch;
if (typeof global.fetch === 'function') {
  fetch = global.fetch;
} else {
  try {
    fetch = require('node-fetch');
  } catch (e) {
    // Fallback to dynamic import for node-fetch v3
    fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
  }
}

// Helper: safe JSON parse
function tryParseJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}

exports.handler = async (event) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const logs = [];
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { phone, amount, account_id, transaction_desc, metadata, customer } = body || {};
    logs.push({ step: 'received', body });

    if (!phone || !amount) {
      logs.push({ step: 'validation_failed', error: 'Missing phone or amount' });
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ success: false, error: 'Missing phone or amount', logs }) };
    }

    function normalizeMpesaPhone(p) {
      if (!p) return null;
      let s = String(p).trim();
      s = s.replace(/[\s\-()]/g, '');
      if (s.startsWith('+')) s = s.slice(1);
      if (s.length === 10 && s.startsWith('0')) return '254' + s.slice(1);
      if (s.length === 9 && s.startsWith('7')) return '254' + s;
      return s;
    }

    const normalizedPhone = normalizeMpesaPhone(phone);
    logs.push({ step: 'phone_normalized', original: phone, normalized: normalizedPhone });

    // Determine webhook URL: prefer explicit env, else default to preocrypto.com
    const webhookUrl = process.env.PAYHERO_CALLBACK_URL || 'https://www.preocrypto.com/webhook/mpesa-callback';
    const payload = {
      amount: Number(amount),
      currency: 'KES',
      payment_method: 'mpesa_stk',
      description: transaction_desc || `PreoCrypto M-PESA STK Push - ${amount} KES`,
      metadata: Object.assign({}, metadata || {}, { user_id: account_id || 'guest', mpesa_phone: normalizedPhone, original_amount: amount }),
      customer: Object.assign({}, customer || {}, { phone: normalizedPhone || phone, name: account_id || 'guest' }),
      webhook_url: webhookUrl
    };
    logs.push({ step: 'payload_prepared', payload });

    const payheroUrl = 'https://backend.payhero.co.ke/api/v2/payments';
    const basicAuth = process.env.PAYHERO_BASIC_AUTH;
    const secretKey = process.env.PAYHERO_SECRET_KEY;
    const accountId = process.env.PAYHERO_ACCOUNT_ID;
    
    // Validate PayHero credentials
    if (!basicAuth && !secretKey) {
      logs.push({ step: 'config_error', error: 'Missing PayHero credentials' });
      return { 
        statusCode: 500,
        headers: corsHeaders, 
        body: JSON.stringify({ 
          success: false, 
          error: 'Payment gateway not configured. Missing PAYHERO_BASIC_AUTH or PAYHERO_SECRET_KEY environment variables.', 
          logs 
        }) 
      };
    }
    
    if (!accountId) {
      logs.push({ step: 'config_error', error: 'Missing account ID' });
      return { 
        statusCode: 500,
        headers: corsHeaders, 
        body: JSON.stringify({ 
          success: false, 
          error: 'Payment gateway not configured. Missing PAYHERO_ACCOUNT_ID environment variable.', 
          logs 
        }) 
      };
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'X-Account-Id': String(accountId),
      'X-Request-ID': `req_${Date.now()}_${Math.random().toString(36).slice(2,9)}`
    };
    
    // Use Basic Auth if available, otherwise use Bearer token
    if (basicAuth) {
      headers['Authorization'] = basicAuth.startsWith('Basic ') ? basicAuth : `Basic ${basicAuth}`;
    } else if (secretKey) {
      headers['Authorization'] = `Bearer ${secretKey}`;
    }

    logs.push({ step: 'calling_payhero', url: payheroUrl, headers: Object.keys(headers), accountId, hasAuth: !!headers['Authorization'] });

    let response;
    try {
      response = await fetch(payheroUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
    } catch (fetchErr) {
      logs.push({ step: 'fetch_error', error: fetchErr.message, code: fetchErr.code, details: String(fetchErr) });
      return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ success: false, error: `Network error: ${fetchErr.message}`, logs }) };
    }

    const text = await response.text();
    const result = tryParseJson(text) || { raw: text };
    logs.push({ step: 'payhero_response', status: response.status, result });

    // Return detailed logs so you can inspect PayHero response in the UI
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: response.ok && (result.success === true || result.data), status: response.status, result, logs })
    };
  } catch (err) {
    logs.push({ step: 'exception', error: err && err.message });
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ success: false, error: err.message, logs }) };
  }
};
