#!/bin/bash

echo "🚀 Setting up API Monitoring MVP..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Create environment files
echo "⚙️  Setting up environment files..."

# Backend environment
if [ ! -f backend/.env ]; then
    cp backend/env.example backend/.env
    echo "📝 Created backend/.env from template"
    echo "⚠️  Please update backend/.env with your configuration:"
    echo "   - JWT_SECRET (generate a secure secret)"
    echo "   - Supabase credentials"
    echo "   - SMTP settings for email alerts"
fi

# Frontend environment
if [ ! -f frontend/.env.local ]; then
    cat > frontend/.env.local << EOF
# Frontend environment variables
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=API Monitor
NEXT_PUBLIC_APP_VERSION=1.0.0
EOF
    echo "📝 Created frontend/.env.local"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Set up your Supabase project:"
echo "   - Create a new project at https://supabase.com"
echo "   - Copy the SQL from backend/src/config/database.ts and run it in Supabase SQL editor"
echo "   - Update backend/.env with your Supabase credentials"
echo ""
echo "2. Configure email settings in backend/.env for alerts"
echo ""
echo "3. Start the development servers:"
echo "   npm run dev"
echo ""
echo "This will start both backend (http://localhost:3001) and frontend (http://localhost:3000)"
echo ""
echo "🔧 Troubleshooting:"
echo "- Make sure ports 3000 and 3001 are available"
echo "- Check backend/.env configuration if authentication fails"
echo "- Verify Supabase connection if database errors occur"
