// Import fetch for Node.js environments without native fetch
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

function tryParseJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const logs = [];
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { email, amount, phone, metadata, customer } = body || {};
    logs.push({ step: 'received', body });
    
    if (!amount) {
      logs.push({ step: 'validation_failed', error: 'Missing amount' });
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Missing amount', logs }) };
    }

    if (!phone) {
      logs.push({ step: 'validation_failed', error: 'Missing phone' });
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Missing phone number', logs }) };
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
    const webhookUrl = process.env.PAYHERO_CALLBACK_URL || 'https://www.preocrypto.com/webhook/mpesa-callback';
    const payload = {
      amount: Number(amount),
      currency: 'KES',
      payment_method: 'mpesa_stk',
      description: `PreoCrypto Deposit - ${amount} KES`,
      metadata: Object.assign({}, metadata || {}, { user_email: email || 'guest', original_amount: amount }),
      customer: Object.assign({}, customer || {}, { email: email || '', phone: normalizedPhone || phone || '' }),
      webhook_url: webhookUrl
    };
    logs.push({ step: 'payload_prepared', payload });

    // Check for PayHero credentials
    const basicAuth = process.env.PAYHERO_BASIC_AUTH;
    const secretKey = process.env.PAYHERO_SECRET_KEY;
    const accountId = process.env.PAYHERO_ACCOUNT_ID;
    
    if (!basicAuth && !secretKey) {
      logs.push({ step: 'config_error', error: 'PayHero credentials not configured' });
      return { 
        statusCode: 500, 
        headers, 
        body: JSON.stringify({ 
          success: false, 
          error: 'Payment gateway not configured. Please contact support.', 
          logs 
        }) 
      };
    }

    const payheroUrl = 'https://backend.payhero.co.ke/api/v2/payments';
    const apiHeaders = {
      'Content-Type': 'application/json',
      'X-Account-Id': String(accountId),
      'X-Request-ID': `req_${Date.now()}_${Math.random().toString(36).slice(2,9)}`
    };
    
    // Use Basic Auth if available, otherwise use Bearer token
    if (basicAuth) {
      apiHeaders['Authorization'] = basicAuth.startsWith('Basic ') ? basicAuth : `Basic ${basicAuth}`;
    } else {
      apiHeaders['Authorization'] = `Bearer ${secretKey}`;
    }

    logs.push({ step: 'calling_payhero', url: payheroUrl, headers: Object.keys(apiHeaders) });
    
    try {
      const response = await fetch(payheroUrl, { method: 'POST', headers: apiHeaders, body: JSON.stringify(payload) });
      const text = await response.text();
      const result = tryParseJson(text) || { raw: text };
      logs.push({ step: 'payhero_response', status: response.status, result });

      return { 
        statusCode: 200, 
        headers, 
        body: JSON.stringify({ 
          success: response.ok && (result.success === true || result.data), 
          status: response.status, 
          result, 
          logs 
        }) 
      };
    } catch (fetchError) {
      logs.push({ step: 'fetch_error', error: fetchError.message, details: String(fetchError) });
      return { 
        statusCode: 500, 
        headers, 
        body: JSON.stringify({ 
          success: false, 
          error: `Network error: ${fetchError.message}`, 
          logs 
        }) 
      };
    }
  } catch (err) {
    logs.push({ step: 'exception', error: err && err.message });
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: err.message, logs }) };
  }
};
