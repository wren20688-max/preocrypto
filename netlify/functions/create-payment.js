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
    
    // Convert USD to KES (assuming amount is in USD, rate ~129)
    const USD_TO_KES_RATE = 129;
    const amountInKES = Math.round(Number(amount) * USD_TO_KES_RATE);
    logs.push({ step: 'currency_conversion', amountUSD: amount, amountKES: amountInKES, rate: USD_TO_KES_RATE });
    
    const webhookUrl = process.env.PAYHERO_CALLBACK_URL || 'https://www.preocrypto.com/webhook/mpesa-callback';
    
    // PayHero v2 API payload structure (official docs)
    const payload = {
      amount: amountInKES,
      phone_number: normalizedPhone,
      channel_id: 4575,
      provider: 'm-pesa',
      external_reference: `PREO-${Date.now()}`,
      callback_url: webhookUrl,
      customer_name: email || 'Guest'
    };
    logs.push({ step: 'payload_prepared', payload });

    const payheroUrl = 'https://backend.payhero.co.ke/api/v2/payments';
    const authToken = process.env.PAYHERO_AUTH_TOKEN;
    
    if (!authToken) {
      logs.push({ step: 'config_error', error: 'Missing PAYHERO_AUTH_TOKEN' });
      return { 
        statusCode: 500, 
        headers, 
        body: JSON.stringify({ 
          success: false, 
          error: 'Payment gateway not configured. Missing PAYHERO_AUTH_TOKEN.', 
          logs 
        }) 
      };
    }
    
    const apiHeaders = {
      'Content-Type': 'application/json',
      'Authorization': authToken
    };

    logs.push({ step: 'calling_payhero', url: payheroUrl, hasAuth: !!authToken });
    
    try {
      const response = await fetch(payheroUrl, {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify(payload)
      });

      const text = await response.text();
      const result = tryParseJson(text) || { raw: text };

      logs.push({ step: 'payhero_response', status: response.status, result });

      if (!response.ok) {
        return {
          statusCode: response.status,
          headers,
          body: JSON.stringify({ success: false, result, logs })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, result, logs })
      };

    } catch (err) {
      logs.push({ step: 'fetch_error', name: err.name, message: err.message, stack: err.stack });
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ success: false, error: err.message, logs })
      };
    }
  } catch (err) {
    logs.push({ step: 'exception', error: err && err.message });
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: err.message, logs }) };
  }
};
