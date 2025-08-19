#!/bin/bash

echo "🚀 Building No-Dues Application for Production..."

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

# Copy frontend build to backend public folder
echo "📁 Copying frontend build to backend..."
mkdir -p public
cp -r frontend/build/* public/

echo "✅ Production build completed!"
echo "🚀 Start the server with: npm start"
