# PreoCrypto Netlify Functions Verification (Windows PowerShell)
# Run this to verify your setup is complete

Write-Host "🔍 Verifying PreoCrypto Netlify Functions Setup..." -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found" -ForegroundColor Red
    exit 1
}

Write-Host "✅ .env file found" -ForegroundColor Green

# Check required environment variables
$requiredVars = @("SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_KEY")
$envContent = Get-Content ".env" -Raw

foreach ($var in $requiredVars) {
    if ($envContent -match "^$var=") {
        Write-Host "✅ $var configured" -ForegroundColor Green
    } else {
        Write-Host "❌ $var missing" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "📁 Checking Netlify Functions..." -ForegroundColor Cyan

$functions = @(
    "user-data.js",
    "custom-withdrawal.js",
    "auth-login.js",
    "auth-register.js",
    "payhero-create-intent.js",
    "payhero-create-payment.js"
)

foreach ($func in $functions) {
    $path = "netlify/functions/$func"
    if (Test-Path $path) {
        Write-Host "✅ $func" -ForegroundColor Green
    } else {
        Write-Host "❌ $func missing" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🚀 Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Add environment variables to Netlify Dashboard:"
Write-Host "     - Site settings → Build & deploy → Environment"
Write-Host "     - Add: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY"
Write-Host ""
Write-Host "  2. Deploy to Netlify:"
Write-Host "     - Push to GitHub (with .env in .gitignore)"
Write-Host "     - Connect repo to Netlify"
Write-Host "     - Auto-deploy on every push"
Write-Host ""
Write-Host "  3. For local testing (optional):"
Write-Host "     - Install Node.js from nodejs.org"
Write-Host "     - Run: npx netlify-cli dev"
Write-Host ""
