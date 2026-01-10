const jwt = require('jsonwebtoken');
const { getUser, getUserByEmail, createUser } = require('./db-supabase');

const JWT_SECRET = process.env.JWT_SECRET || 'preocrypto-secret-key-change-in-production';

// Demo users (read-only, cannot register with these usernames)
const DEMO_USERS = {
  'demo': { username: 'demo', password: 'demo123', name: 'Demo User', email: 'demo@preocrypto.com' },
  'testuser': { username: 'testuser', password: 'test123', name: 'Test User', email: 'test@preocrypto.com' }
};

exports.handler = async (event, context) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { username, password, name, email, country } = JSON.parse(event.body || '{}');

    // Require email in addition to username/password/name
    if (!username || !password || !name || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Username, password, name and email are required' })
      };
    }

    // Check if demo user
    if (DEMO_USERS[username]) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'User already exists' })
      };
    }

    // Check existing user in database
    const existingUser = await getUser(username);
    const existingEmail = email ? await getUserByEmail(email) : null;
    
    if (existingUser || existingEmail) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'User already exists' })
      };
    }

    // Create new user
    const newUser = {
      username,
      password, // In production, hash this with bcrypt
      name,
      email,
      country: country || null,
      demo_balance: 10000,
      real_balance: 0,
      created_at: new Date().toISOString(),
      is_admin: false
    };

    await createUser(newUser);

    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true, 
        token, 
        user: { username, name } 
      })
    };
  } catch (err) {
    console.error('Registration error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Registration failed: ' + err.message })
    };
  }
};
