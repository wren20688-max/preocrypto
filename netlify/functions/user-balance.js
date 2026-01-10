// User endpoint to get their own balance
const { getUser, getUserByEmail, verifyToken } = require('./db-supabase');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    // Get token from Authorization header
    const authHeader = event.headers.authorization || event.headers.Authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    
    if (!token) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized - No token provided' })
      };
    }

    // Verify token and get username
    const tokenData = await verifyToken(token);
    if (!tokenData || !tokenData.username) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized - Invalid token' })
      };
    }

    // Get user data
    const user = await getUser(tokenData.username);
    if (!user) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    // Return balance data
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        demo_balance: parseFloat(user.demo_balance || 0),
        real_balance: parseFloat(user.real_balance || 0),
        username: user.username,
        email: user.email,
        role: user.role || 'normal'
      })
    };
  } catch (error) {
    console.error('User balance error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch balance', message: error.message })
    };
  }
};
