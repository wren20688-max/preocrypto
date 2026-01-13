const jwt = require('jsonwebtoken');
const { getUser, getUserByEmail, saveToken } = require('./db-supabase');

const JWT_SECRET = process.env.JWT_SECRET || 'preocrypto-secret-key-change-in-production';

// Demo users
const DEMO_USERS = {
  'demo': { username: 'demo', password: 'demo123', name: 'Demo User', email: 'demo@preocrypto.com' },
  'testuser': { username: 'testuser', password: 'test123', name: 'Test User', email: 'test@preocrypto.com' },
  'wren20688@gmail.com': {
    username: 'admin',
    password: 'Jos134ka2',
    name: 'Admin',
    email: 'wren20688@gmail.com',
    isAdmin: true
  }
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
    const { username, password } = JSON.parse(event.body || '{}');

    if (!username || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'username and password required' })
      };
    }

    // Try direct username match first
    let user = DEMO_USERS[username] || await getUser(username);
    
    // If identifier is an email, try to find by email
    if (!user && username.includes('@')) {
      user = await getUserByEmail(username);
    }

    if (!user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid credentials' })
      };
    }

    // Password check (note: demo/stored passwords are plaintext in this demo)
    if (!user.password || String(user.password) !== String(password)) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid credentials' })
      };
    }

    const token = jwt.sign({ username: user.username || username }, JWT_SECRET, { expiresIn: '24h' });
    
    // Store token for logout support
    await saveToken({ 
      token, 
      username: user.username || username, 
      issued_at: new Date().toISOString()
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true, 
        token, 
        user: { 
          username: user.username || username, 
          name: user.name || user.username || username, 
          email: user.email || null, 
          isAdmin: !!user.isAdmin 
        } 
      })
    };
  } catch (err) {
    console.error('Login error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Login failed: ' + err.message })
    };
  }
};
