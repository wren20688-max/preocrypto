const fetch = global.fetch || require('node-fetch');

// Helper: safe JSON parse
function tryParseJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const logs = [];
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { phone, amount, account_id, transaction_desc, metadata, customer } = body || {};
    logs.push({ step: 'received', body });

    if (!phone || !amount) {
      logs.push({ step: 'validation_failed', error: 'Missing phone or amount' });
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Missing phone or amount', logs }) };
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

    // Determine webhook URL: prefer explicit env, else SITE_URL + function path
    const webhookUrl = process.env.PAYHERO_CALLBACK_URL || ((process.env.SITE_URL || '').replace(/\/$/, '') + '/webhook/mpesa-callback');
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

    const payheroUrl = 'https://api.payhero.io/v1/payment/create';
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.PAYHERO_SECRET_KEY || ''}`,
      'X-Account-Id': String(process.env.PAYHERO_ACCOUNT_ID || ''),
      'X-Request-ID': `req_${Date.now()}_${Math.random().toString(36).slice(2,9)}`
    };

    logs.push({ step: 'calling_payhero', url: payheroUrl, headers: Object.keys(headers) });

    const response = await fetch(payheroUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    const result = tryParseJson(text) || { raw: text };
    logs.push({ step: 'payhero_response', status: response.status, result });

    // Return detailed logs so you can inspect PayHero response in the UI
    return {
      statusCode: 200,
      body: JSON.stringify({ success: response.ok && (result.success === true || result.data), status: response.status, result, logs })
    };
  } catch (err) {
    logs.push({ step: 'exception', error: err && err.message });
    return { statusCode: 500, body: JSON.stringify({ success: false, error: err.message, logs }) };
  }
};
