#!/bin/bash

# Install backend dependencies
echo "Installing backend dependencies..."
npm install

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install --production=false

# Build frontend
echo "Building frontend..."
npm run build

echo "Build completed successfully!"
