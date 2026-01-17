#!/bin/bash

# EkLabs API Gateway Setup Script
# This script helps set up the development environment

echo "🚀 Setting up EkLabs API Gateway..."
echo ""

# Check Python version
echo "Checking Python version..."
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "✓ Python $python_version found"
echo ""

# Create virtual environment (optional but recommended)
read -p "Create virtual environment? (y/n): " create_venv
if [ "$create_venv" = "y" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    echo "✓ Virtual environment created and activated"
    echo ""
fi

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt
echo "✓ Dependencies installed"
echo ""

# Setup environment file
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env and add your Supabase credentials"
    echo ""
else
    echo "✓ .env file already exists"
    echo ""
fi

# Generate session secret if needed
echo "Generating session secret key..."
secret_key=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
echo "Add this to your .env file as SESSION_SECRET_KEY:"
echo "$secret_key"
echo ""

# Summary
echo "📋 Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your Supabase credentials:"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_SERVICE_KEY"
echo "   - SESSION_SECRET_KEY (generated above)"
echo ""
echo "2. Start the development server:"
echo "   uvicorn src.main:app --reload --port 8000"
echo ""
echo "3. Access API documentation:"
echo "   http://localhost:8000/docs"
echo ""
echo "For detailed documentation, see:"
echo "   - README.md (this directory)"
echo "   - ../../docs/AUTHENTICATION.md (authentication details)"
echo ""
