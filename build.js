const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting build process...');

try {
  // Check if we're in the right directory
  console.log('📁 Current directory:', process.cwd());
  
  // Check if frontend/public/index.html exists
  const indexHtmlPath = path.join(__dirname, 'frontend', 'public', 'index.html');
  if (!fs.existsSync(indexHtmlPath)) {
    throw new Error(`index.html not found at: ${indexHtmlPath}`);
  }
  console.log('✅ Found index.html template');

  // Install backend dependencies
  console.log('📦 Installing backend dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  // Change to frontend directory
  console.log('📁 Changing to frontend directory...');
  process.chdir(path.join(__dirname, 'frontend'));
  console.log('📁 Now in directory:', process.cwd());

  // Install frontend dependencies
  console.log('📦 Installing frontend dependencies...');
  execSync('npm install --legacy-peer-deps --force', { stdio: 'inherit' });

  // Build frontend
  console.log('🔨 Building frontend...');
  execSync('npm run build', { stdio: 'inherit' });

  // Check if build was successful
  const buildIndexPath = path.join(__dirname, 'build', 'index.html');
  if (!fs.existsSync(buildIndexPath)) {
    throw new Error(`Build failed: index.html not created at: ${buildIndexPath}`);
  }
  console.log('✅ Build index.html created successfully');

  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
