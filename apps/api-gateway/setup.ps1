# EkLabs API Gateway Setup Script for Windows
# This script helps set up the development environment

Write-Host "🚀 Setting up EkLabs API Gateway..." -ForegroundColor Green
Write-Host ""

# Check Python version
Write-Host "Checking Python version..." -ForegroundColor Cyan
$pythonVersion = python --version 2>&1
Write-Host "✓ $pythonVersion found" -ForegroundColor Green
Write-Host ""

# Create virtual environment (optional but recommended)
$createVenv = Read-Host "Create virtual environment? (y/n)"
if ($createVenv -eq "y") {
    Write-Host "Creating virtual environment..." -ForegroundColor Cyan
    python -m venv venv
    .\venv\Scripts\Activate.ps1
    Write-Host "✓ Virtual environment created and activated" -ForegroundColor Green
    Write-Host ""
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Cyan
pip install -r requirements.txt
Write-Host "✓ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Setup environment file
if (-not (Test-Path .env)) {
    Write-Host "Creating .env file from template..." -ForegroundColor Cyan
    Copy-Item .env.example .env
    Write-Host "⚠️  Please edit .env and add your Supabase credentials" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "✓ .env file already exists" -ForegroundColor Green
    Write-Host ""
}

# Generate session secret
Write-Host "Generating session secret key..." -ForegroundColor Cyan
$secretKey = python -c "import secrets; print(secrets.token_urlsafe(32))"
Write-Host "Add this to your .env file as SESSION_SECRET_KEY:" -ForegroundColor Yellow
Write-Host $secretKey -ForegroundColor White
Write-Host ""

# Summary
Write-Host "📋 Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env file with your Supabase credentials:"
Write-Host "   - SUPABASE_URL"
Write-Host "   - SUPABASE_SERVICE_KEY"
Write-Host "   - SESSION_SECRET_KEY (generated above)"
Write-Host ""
Write-Host "2. Start the development server:"
Write-Host "   uvicorn src.main:app --reload --port 8000"
Write-Host ""
Write-Host "3. Access API documentation:"
Write-Host "   http://localhost:8000/docs"
Write-Host ""
Write-Host "For detailed documentation, see:" -ForegroundColor Cyan
Write-Host "   - README.md (this directory)"
Write-Host "   - ../../docs/AUTHENTICATION.md (authentication details)"
Write-Host ""
