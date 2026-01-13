#!/bin/bash
# PreoCrypto Netlify Functions Verification Script

echo "🔍 Verifying PreoCrypto Netlify Functions Setup..."
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found"
    exit 1
fi

echo "✅ .env file found"

# Check required environment variables
for var in SUPABASE_URL SUPABASE_ANON_KEY SUPABASE_SERVICE_KEY; do
    if grep -q "^$var=" .env; then
        echo "✅ $var configured"
    else
        echo "❌ $var missing"
        exit 1
    fi
done

echo ""
echo "📁 Checking Netlify Functions..."
functions=(
    "user-data.js"
    "custom-withdrawal.js"
    "auth-login.js"
    "auth-register.js"
    "payhero-create-intent.js"
    "payhero-create-payment.js"
)

for func in "${functions[@]}"; do
    if [ -f "netlify/functions/$func" ]; then
        echo "✅ $func"
    else
        echo "❌ $func missing"
    fi
done

echo ""
echo "🚀 Setup Complete!"
echo ""
echo "To deploy to Netlify:"
echo "  1. Install Netlify CLI: npm install -g netlify-cli"
echo "  2. Run: netlify deploy --prod"
echo ""
echo "For local development:"
echo "  1. Run: netlify dev"
echo "  2. Visit: http://localhost:8888"
