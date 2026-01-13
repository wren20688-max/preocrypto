#!/usr/bin/env node
/**
 * PreoCrypto Netlify + Supabase Setup Complete
 * =============================================
 * 
 * This script verifies all configurations are in place
 * Run: node check-setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 PreoCrypto Setup Verification\n');
console.log('='.repeat(50));

let allGood = true;

// Check .env file
console.log('\n✓ Environment Variables');
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  const checks = [
    { name: 'SUPABASE_URL', regex: /SUPABASE_URL=/ },
    { name: 'SUPABASE_ANON_KEY', regex: /SUPABASE_ANON_KEY=/ },
    { name: 'SUPABASE_SERVICE_KEY', regex: /SUPABASE_SERVICE_KEY=/ },
  ];
  
  checks.forEach(check => {
    if (check.regex.test(envContent)) {
      console.log(`  ✅ ${check.name} configured`);
    } else {
      console.log(`  ❌ ${check.name} MISSING`);
      allGood = false;
    }
  });
} else {
  console.log('  ❌ .env file not found');
  allGood = false;
}

// Check .gitignore
console.log('\n✓ Git Configuration');
if (fs.existsSync('.gitignore')) {
  const gitignore = fs.readFileSync('.gitignore', 'utf8');
  if (gitignore.includes('.env')) {
    console.log('  ✅ .env is in .gitignore (secrets protected)');
  } else {
    console.log('  ⚠️  .env NOT in .gitignore (dangerous!)');
  }
} else {
  console.log('  ⚠️  .gitignore not found');
}

// Check Netlify functions
console.log('\n✓ Netlify Functions');
const functionsDir = './netlify/functions';
if (fs.existsSync(functionsDir)) {
  const functions = fs.readdirSync(functionsDir)
    .filter(f => f.endsWith('.js'))
    .filter(f => f !== 'package.json')
    .sort();
  
  console.log(`  ✅ Found ${functions.length} functions:`);
  const critical = [
    'user-data.js',
    'custom-withdrawal.js',
    'auth-login.js',
    'auth-register.js',
    'payhero-create-intent.js'
  ];
  
  critical.forEach(fn => {
    if (functions.includes(fn)) {
      console.log(`     ✅ ${fn}`);
    } else {
      console.log(`     ❌ ${fn} MISSING`);
      allGood = false;
    }
  });
} else {
  console.log('  ❌ netlify/functions directory not found');
  allGood = false;
}

// Check netlify.toml
console.log('\n✓ Netlify Configuration');
if (fs.existsSync('netlify.toml')) {
  const toml = fs.readFileSync('netlify.toml', 'utf8');
  if (toml.includes('functions = "netlify/functions"')) {
    console.log('  ✅ Functions directory configured');
  }
  if (toml.includes('/api/*') && toml.includes('.netlify/functions')) {
    console.log('  ✅ API redirect configured');
  }
} else {
  console.log('  ❌ netlify.toml not found');
  allGood = false;
}

// Check storage.js
console.log('\n✓ Frontend Configuration');
if (fs.existsSync('storage.js')) {
  const storage = fs.readFileSync('storage.js', 'utf8');
  if (storage.includes('/api/user-data')) {
    console.log('  ✅ storage.js configured for /api/user-data');
  }
} else {
  console.log('  ⚠️  storage.js not found');
}

// Check Supabase schema
console.log('\n✓ Supabase Configuration');
if (fs.existsSync('supabase-schema.sql')) {
  console.log('  ✅ supabase-schema.sql present');
  console.log('     → Must be run in Supabase SQL Editor');
} else {
  console.log('  ❌ supabase-schema.sql not found');
  allGood = false;
}

// Check documentation
console.log('\n✓ Documentation');
const docs = [
  'SETUP.md',
  'QUICK_START.md',
  'DEPLOYMENT_CHECKLIST.md'
];

docs.forEach(doc => {
  if (fs.existsSync(doc)) {
    console.log(`  ✅ ${doc}`);
  } else {
    console.log(`  ⚠️  ${doc} not found`);
  }
});

// Summary
console.log('\n' + '='.repeat(50));

if (allGood) {
  console.log('✅ Setup Complete! Ready for deployment.\n');
  console.log('Next steps:');
  console.log('  1. Read QUICK_START.md for 3-step deployment');
  console.log('  2. Run supabase-schema.sql in Supabase SQL Editor');
  console.log('  3. Push to GitHub');
  console.log('  4. Deploy to Netlify (auto or manual)\n');
} else {
  console.log('⚠️  Some issues found. Check above for details.\n');
}

console.log('Admin Credentials:');
console.log('  Email: wren20688@gmail.com');
console.log('  Password: Jos134ka2\n');

process.exit(allGood ? 0 : 1);
