#!/bin/bash

echo "🚀 Deploying No-Dues Application..."

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install --legacy-peer-deps --force
cd ..

# Build frontend
echo "🔨 Building frontend..."
cd frontend
npm run build
cd ..

echo "✅ Build completed!"
echo ""
echo "📋 Deployment Instructions:"
echo "1. Backend (Railway):"
echo "   - Push to Railway: git push railway main"
echo "   - Set environment variables in Railway dashboard"
echo ""
echo "2. Frontend (Vercel):"
echo "   - Deploy frontend folder to Vercel"
echo "   - Set REACT_APP_API_URL environment variable"
echo ""
echo "3. Environment Variables to set:"
echo "   Backend (Railway):"
echo "   - MONGODB_URI"
echo "   - JWT_SECRET"
echo "   - FRONTEND_URL"
echo ""
echo "   Frontend (Vercel):"
echo "   - REACT_APP_API_URL (your Railway backend URL)"
