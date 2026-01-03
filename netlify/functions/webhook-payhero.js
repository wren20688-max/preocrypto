exports.handler = async (event) => {
  // Accept POST webhook calls from PayHero. Netlify functions don't persist to file,
  // so for now we log and return 200. If you need to update a database, call
  // an external DB service from here (Firestore, Supabase, etc.).
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const body = event.body || '';
    const headers = event.headers || {};
    console.log('[PayHero Webhook] headers:', headers);
    console.log('[PayHero Webhook] body:', body);

    // Optionally, validate signature here if PayHero provides one.

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('Webhook handler error', err);
    return { statusCode: 500, body: JSON.stringify({ success: false, error: err.message }) };
  }
};
