const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting build process...');

try {
  // Install backend dependencies
  console.log('📦 Installing backend dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  // Change to frontend directory
  console.log('📁 Changing to frontend directory...');
  process.chdir(path.join(__dirname, 'frontend'));

  // Install frontend dependencies
  console.log('📦 Installing frontend dependencies...');
  execSync('npm install --legacy-peer-deps --force', { stdio: 'inherit' });

  // Build frontend
  console.log('🔨 Building frontend...');
  execSync('npm run build', { stdio: 'inherit' });

  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
