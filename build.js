const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚂 Railway Build Process Starting...');

try {
  // Check if we're in the right directory
  console.log('📁 Current directory:', process.cwd());
  console.log('📁 __dirname:', __dirname);
  
  // List all files in current directory
  console.log('📁 All files in current directory:', fs.readdirSync(__dirname));
  
  // Check if frontend directory exists
  const frontendPath = path.join(__dirname, 'frontend');
  if (!fs.existsSync(frontendPath)) {
    throw new Error(`Frontend directory not found at: ${frontendPath}`);
  }
  console.log('✅ Found frontend directory');
  
  // Check if frontend/public/index.html exists
  const indexHtmlPath = path.join(frontendPath, 'public', 'index.html');
  console.log('🔍 Looking for index.html at:', indexHtmlPath);
  
  if (!fs.existsSync(indexHtmlPath)) {
    console.log('📁 Contents of frontend directory:', fs.readdirSync(frontendPath));
    const publicPath = path.join(frontendPath, 'public');
    if (fs.existsSync(publicPath)) {
      console.log('📁 Contents of frontend/public directory:', fs.readdirSync(publicPath));
    } else {
      console.log('❌ frontend/public directory does not exist');
    }
    throw new Error(`index.html not found at: ${indexHtmlPath}`);
  }
  console.log('✅ Found index.html template');

  // Change to frontend directory
  console.log('📁 Changing to frontend directory...');
  process.chdir(frontendPath);
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

  console.log('✅ Railway build completed successfully!');
} catch (error) {
  console.error('❌ Railway build failed:', error.message);
  process.exit(1);
}
