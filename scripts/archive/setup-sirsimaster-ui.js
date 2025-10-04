#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Create local dist folder for SirsiMaster UI
const distDir = path.join(__dirname, '..', 'assets', 'vendor', 'sirsimaster-ui');
fs.mkdirSync(distDir, { recursive: true });

// Copy the CSS file from sirsimaster-ui to the local vendor folder
const sourceCSS = path.join(__dirname, '..', 'sirsimaster-ui', 'dist', 'sirsimaster-ui.css');
const targetCSS = path.join(distDir, 'sirsimaster-ui.css');

if (fs.existsSync(sourceCSS)) {
  fs.copyFileSync(sourceCSS, targetCSS);
  console.log('✅ Copied SirsiMaster UI CSS to assets/vendor/sirsimaster-ui/');
  
  // Also copy to assiduous-build if it exists
  const buildDir = path.join(__dirname, '..', 'firebase-migration-package', 'assiduous-build', 'assets', 'vendor', 'sirsimaster-ui');
  if (fs.existsSync(path.dirname(path.dirname(buildDir)))) {
    fs.mkdirSync(buildDir, { recursive: true });
    fs.copyFileSync(sourceCSS, path.join(buildDir, 'sirsimaster-ui.css'));
    console.log('✅ Also copied to assiduous-build/assets/vendor/sirsimaster-ui/');
  }
} else {
  console.log('⚠️  Source CSS file not found. Please ensure sirsimaster-ui/dist/sirsimaster-ui.css exists.');
}

// Update all HTML files to use local path instead of CDN during development
const updateToLocalPath = process.argv.includes('--local');

if (updateToLocalPath) {
  console.log('\n📝 Updating HTML files to use local SirsiMaster UI path...');
  
  function findHtmlFiles(dir, files = []) {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      if (fs.statSync(fullPath).isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        findHtmlFiles(fullPath, files);
      } else if (item.endsWith('.html')) {
        files.push(fullPath);
      }
    });
    return files;
  }
  
  const adminDir = path.join(__dirname, '..', 'admin');
  const htmlFiles = findHtmlFiles(adminDir);
  
  let updatedCount = 0;
  htmlFiles.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Replace CDN URL with local path
    if (content.includes('cdn.jsdelivr.net/gh/SirsiMaster/ui-components')) {
      content = content.replace(
        /https:\/\/cdn\.jsdelivr\.net\/gh\/SirsiMaster\/ui-components@latest\/dist\/sirsimaster-ui\.css/g,
        '../assets/vendor/sirsimaster-ui/sirsimaster-ui.css'
      );
      
      fs.writeFileSync(filePath, content, 'utf-8');
      updatedCount++;
    }
  });
  
  console.log(`✅ Updated ${updatedCount} HTML files to use local SirsiMaster UI path`);
}

console.log('\n🎉 Setup complete!');
console.log('\n📋 Usage:');
console.log('  node scripts/setup-sirsimaster-ui.js          # Copy CSS to vendor folder');
console.log('  node scripts/setup-sirsimaster-ui.js --local  # Also update HTML to use local path');
console.log('\n💡 For production, push sirsimaster-ui to GitHub and use CDN links.');
