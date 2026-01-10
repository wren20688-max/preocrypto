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

    // Convert USD to KES (assuming amount is in USD, rate ~129)
    const USD_TO_KES_RATE = 129;
    const amountInKES = Math.round(Number(amount) * USD_TO_KES_RATE);
    logs.push({ step: 'currency_conversion', amountUSD: amount, amountKES: amountInKES, rate: USD_TO_KES_RATE });

    // Determine webhook URL: prefer explicit env, else default to preocrypto.com
    const webhookUrl = process.env.PAYHERO_CALLBACK_URL || 'https://www.preocrypto.com/webhook/mpesa-callback';
    const payload = {
      amount: amountInKES,
      phone_number: normalizedPhone,
      channel_id: 4575,
      provider: 'm-pesa',
      external_reference: `PREO-${Date.now()}`,
      callback_url: webhookUrl,
      customer_name: account_id || metadata?.user || 'Guest'
    };
    logs.push({ step: 'payload_prepared', payload });

    const payheroUrl = 'https://backend.payhero.co.ke/api/v2/payments';
    const authToken = process.env.PAYHERO_AUTH_TOKEN;
    
    if (!authToken) {
      logs.push({ step: 'config_error', error: 'Missing PAYHERO_AUTH_TOKEN' });
      return { 
        statusCode: 500,
        headers: corsHeaders, 
        body: JSON.stringify({ 
          success: false, 
          error: 'Payment gateway not configured. Missing PAYHERO_AUTH_TOKEN.', 
          logs 
        }) 
      };
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': authToken
    };

    logs.push({ step: 'calling_payhero', url: payheroUrl, hasAuth: !!authToken });

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
