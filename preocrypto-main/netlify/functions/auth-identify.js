const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'preocrypto-secret-key-change-in-production';

// Demo users
const DEMO_USERS = {
  'demo': { username: 'demo', password: 'demo123', name: 'Demo User', email: 'demo@preocrypto.com', demoBalance: 10000, realBalance: 0 },
  'testuser': { username: 'testuser', password: 'test123', name: 'Test User', email: 'test@preocrypto.com', demoBalance: 10000, realBalance: 0 }
};

// In-memory storage
let memoryDB = { users: {}, tokens: [], privileged: [], withdrawals: [], trades: [], payments: [], transactions: [], resetCodes: {} };

function loadDB() {
  return memoryDB;
}

exports.handler = async (event, context) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'No token provided' })
      };
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    const username = decoded.username;
    const db = loadDB();
    
    const user = db.users[username] || DEMO_USERS[username];
    
    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true,
        user: {
          username: user.username || username,
          name: user.name || user.username || username,
          email: user.email || null,
          isAdmin: !!user.isAdmin,
          demoBalance: user.demoBalance || 10000,
          realBalance: user.realBalance || 0
        }
      })
    };
  } catch (err) {
    console.error('Identify error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to identify user: ' + err.message })
    };
  }
};
