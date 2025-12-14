#!/bin/bash

# Quick deployment script
# Usage: ./deploy.sh [backend|frontend|all]

set -e

echo "🚀 API Monitoring Deployment Script"
echo "===================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env files exist
check_env_files() {
    if [ ! -f "backend/.env" ]; then
        echo -e "${RED}❌ backend/.env not found!${NC}"
        echo "Please copy backend/env.example to backend/.env and configure it."
        exit 1
    fi
    
    if [ ! -f "frontend/.env.local" ]; then
        echo -e "${YELLOW}⚠️  frontend/.env.local not found${NC}"
        echo "Creating from template..."
        cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=API Monitor
NEXT_PUBLIC_APP_VERSION=1.0.0
EOF
    fi
}

# Build backend
build_backend() {
    echo -e "${GREEN}📦 Building backend...${NC}"
    cd backend
    npm install
    npm run build
    cd ..
    echo -e "${GREEN}✅ Backend built successfully${NC}"
}

# Build frontend
build_frontend() {
    echo -e "${GREEN}📦 Building frontend...${NC}"
    cd frontend
    npm install
    npm run build
    cd ..
    echo -e "${GREEN}✅ Frontend built successfully${NC}"
}

# Deploy with Docker
deploy_docker() {
    echo -e "${GREEN}🐳 Deploying with Docker...${NC}"
    
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}⚠️  .env file not found in root${NC}"
        echo "Creating .env from backend/.env..."
        cp backend/.env .env
        echo "Please update .env with your production values!"
    fi
    
    docker-compose build
    docker-compose up -d
    
    echo -e "${GREEN}✅ Docker deployment complete${NC}"
    echo "Backend: http://localhost:3001"
    echo "Frontend: http://localhost:3000"
}

# Main deployment logic
DEPLOY_TARGET=${1:-all}

case $DEPLOY_TARGET in
    backend)
        check_env_files
        build_backend
        echo -e "${GREEN}✅ Backend ready for deployment${NC}"
        echo "Next steps:"
        echo "1. Push to your repository"
        echo "2. Deploy to Railway/Render/etc."
        echo "3. Run migrations: npm run migrate:up"
        ;;
    frontend)
        check_env_files
        build_frontend
        echo -e "${GREEN}✅ Frontend ready for deployment${NC}"
        echo "Next steps:"
        echo "1. Push to your repository"
        echo "2. Deploy to Vercel/Netlify/etc."
        ;;
    all)
        check_env_files
        build_backend
        build_frontend
        echo -e "${GREEN}✅ Both backend and frontend built successfully${NC}"
        echo "Ready for deployment!"
        ;;
    docker)
        deploy_docker
        ;;
    *)
        echo "Usage: ./deploy.sh [backend|frontend|all|docker]"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 Deployment preparation complete!${NC}"
echo "See DEPLOYMENT.md for detailed deployment instructions."

