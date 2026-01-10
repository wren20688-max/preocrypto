// Admin endpoint to add marketer
const { getUser, getUserByEmail, updateUser } = require('./db-supabase');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    // Verify admin token
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    const { email, marketer_code } = JSON.parse(event.body || '{}');
    
    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email is required' })
      };
    }

    // Get user by email
    const user = await getUserByEmail(email);
    
    if (!user) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    // Generate marketer code if not provided
    const code = marketer_code || 'MKT-' + Math.random().toString(36).substr(2, 9).toUpperCase();

    // Update user to marketer
    const updated = await updateUser(user.username || user.email, {
      is_marketer: true,
      marketer_code: code
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, user: updated })
    };
  } catch (error) {
    console.error('Add marketer error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to add marketer', message: error.message })
    };
  }
};
