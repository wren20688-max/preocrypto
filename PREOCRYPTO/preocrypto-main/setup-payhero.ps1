# PayHero Integration Quick Setup Script
# Run this after installing Node.js

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   PreoCrypto PayHero Setup" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "[1/6] Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "  ✓ Node.js $nodeVersion installed" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Node.js not found!" -ForegroundColor Red
    Write-Host "  Please install Node.js from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check if npm is available
Write-Host "[2/6] Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "  ✓ npm $npmVersion installed" -ForegroundColor Green
} catch {
    Write-Host "  ✗ npm not found!" -ForegroundColor Red
    exit 1
}

# Install Netlify CLI globally
Write-Host "[3/6] Installing Netlify CLI..." -ForegroundColor Yellow
try {
    npm install -g netlify-cli
    Write-Host "  ✓ Netlify CLI installed" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ Error installing Netlify CLI (may already be installed)" -ForegroundColor Yellow
}

# Install function dependencies
Write-Host "[4/6] Installing Netlify Functions dependencies..." -ForegroundColor Yellow
Set-Location "netlify\functions"
npm install
Set-Location "..\..\"
Write-Host "  ✓ Dependencies installed" -ForegroundColor Green

# Check for .env file
Write-Host "[5/6] Checking environment configuration..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "  ✓ .env file exists" -ForegroundColor Green
} else {
    Write-Host "  ⚠ .env file not found" -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "  ✓ Created .env from template" -ForegroundColor Green
        Write-Host ""
        Write-Host "  ⚠ IMPORTANT: Edit .env file and add your PayHero credentials!" -ForegroundColor Red
        Write-Host "  Get credentials from: https://dashboard.payhero.io" -ForegroundColor Cyan
    }
}

Write-Host ""
Write-Host "[6/6] Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Next Steps:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "1. Get PayHero credentials from: https://dashboard.payhero.io" -ForegroundColor White
Write-Host "2. Edit .env file and add your PAYHERO_SECRET_KEY and PAYHERO_ACCOUNT_ID" -ForegroundColor White
Write-Host "3. Run: netlify dev" -ForegroundColor White
Write-Host "4. Open: http://localhost:8888/deposit.html" -ForegroundColor White
Write-Host ""
Write-Host "For detailed setup instructions, see: PAYHERO_SETUP_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
