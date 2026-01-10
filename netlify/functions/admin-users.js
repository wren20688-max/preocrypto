// Admin endpoint to get all users and manage them
const { getAllUsers, updateUserRole, updateUserBalance, getUserByUsername, getUserByEmail } = require('./db-supabase');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // GET - Fetch all users
  if (event.httpMethod === 'GET') {
    try {
      const users = await getAllUsers();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ users: users || [] })
      };
    } catch (error) {
      console.error('Admin users error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to fetch users', message: error.message })
      };
    }
  }

  // POST - Update user (role or balance)
  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');
      const { action, id, role, account, balance } = body;

      // Update role
      if (action === 'role') {
        await updateUserRole(id, role);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, role })
        };
      }

      // Update balance
      if (action === 'set-balance') {
        await updateUserBalance(id, account, parseFloat(balance));
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, account, balance })
        };
      }

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid action' })
      };
    } catch (error) {
      console.error('Admin update error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to update user', message: error.message })
      };
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method Not Allowed' })
  };
};
