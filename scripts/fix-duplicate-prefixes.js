#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to recursively find HTML files
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

// Find all HTML files in admin directory
const adminDir = path.join(__dirname, '..', 'admin');
const adminFiles = findHtmlFiles(adminDir);

console.log(`Found ${adminFiles.length} HTML files to fix...`);

let totalFixes = 0;

adminFiles.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf-8');
  let fixes = 0;
  const fileName = path.relative(path.join(__dirname, '..'), filePath);
  
  // Skip backup files
  if (fileName.includes('backup') || fileName.includes('_old')) {
    return;
  }
  
  // Fix duplicate sm-sm- prefixes
  const patterns = [
    { from: /sirsi-sm-sm-card/g, to: 'sm-card' },
    { from: /sirsi-sm-card/g, to: 'sm-card' },
    { from: /sirsi-sm-sm-badge/g, to: 'sm-badge' },
    { from: /sirsi-sm-badge/g, to: 'sm-badge' },
    { from: /sirsi-sm-sm-card-/g, to: 'sm-card-' },
    { from: /sirsi-sm-card-/g, to: 'sm-card-' },
    { from: /sirsi-sm-sm-badge-/g, to: 'sm-badge-' },
    { from: /sirsi-sm-badge-/g, to: 'sm-badge-' },
    { from: /sm-sm-card/g, to: 'sm-card' },
    { from: /sm-sm-badge/g, to: 'sm-badge' },
    // Fix class names with old prefixes
    { from: /class="sirsi-badge/g, to: 'class="sm-badge' },
    { from: /class="sirsi-card/g, to: 'class="sm-card' },
    // Fix button classes
    { from: /class="table-action"/g, to: 'class="sm-btn sm-btn-primary sm-btn-sm"' },
  ];
  
  patterns.forEach(pattern => {
    const matches = content.match(pattern.from);
    if (matches) {
      fixes += matches.length;
      content = content.replace(pattern.from, pattern.to);
    }
  });
  
  if (fixes > 0) {
    // Write the updated content
    fs.writeFileSync(filePath, content, 'utf-8');
    
    // Also update in assiduous-build if it exists
    const buildPath = filePath.replace('/admin/', '/firebase-migration-package/assiduous-build/admin/');
    if (fs.existsSync(path.dirname(buildPath))) {
      fs.mkdirSync(path.dirname(buildPath), { recursive: true });
      fs.writeFileSync(buildPath, content, 'utf-8');
    }
    
    console.log(`✅ Fixed ${fileName}: ${fixes} corrections made`);
    totalFixes += fixes;
  }
});

console.log(`\n🎉 Total fixes made: ${totalFixes}`);
console.log('✨ All duplicate prefixes and class names have been corrected!');
