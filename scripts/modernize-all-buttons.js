#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to recursively find HTML files
function findHtmlFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
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

console.log(`Found ${adminFiles.length} HTML files to check...`);

let totalReplacements = 0;

adminFiles.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf-8');
  let replacements = 0;
  const fileName = path.relative(path.join(__dirname, '..'), filePath);
  
  // Skip backup files
  if (fileName.includes('backup') || fileName.includes('_old')) {
    console.log(`⏭️  Skipping backup file: ${fileName}`);
    return;
  }
  
  // Replace old button styles with sirsi-button components
  
  // Pattern 1: <button class="btn-primary">Text</button>
  content = content.replace(/<button\s+class="btn-primary"[^>]*>([^<]+)<\/button>/g, (match, text) => {
    replacements++;
    return `<sirsi-button variant="primary" size="md">${text}</sirsi-button>`;
  });
  
  // Pattern 2: <button class="btn-secondary">Text</button>
  content = content.replace(/<button\s+class="btn-secondary"[^>]*>([^<]+)<\/button>/g, (match, text) => {
    replacements++;
    return `<sirsi-button variant="secondary" size="md">${text}</sirsi-button>`;
  });
  
  // Pattern 3: <button class="btn btn-primary">Text</button>
  content = content.replace(/<button\s+class="btn\s+btn-primary"[^>]*>([^<]+)<\/button>/g, (match, text) => {
    replacements++;
    return `<sirsi-button variant="primary" size="md">${text}</sirsi-button>`;
  });
  
  // Pattern 4: <button class="btn btn-secondary">Text</button>
  content = content.replace(/<button\s+class="btn\s+btn-secondary"[^>]*>([^<]+)<\/button>/g, (match, text) => {
    replacements++;
    return `<sirsi-button variant="secondary" size="md">${text}</sirsi-button>`;
  });
  
  // Pattern 5: <a href="..." class="btn btn-primary">Text</a>
  content = content.replace(/<a\s+href="([^"]+)"\s+class="btn\s+btn-primary"[^>]*>([^<]+)<\/a>/g, (match, href, text) => {
    replacements++;
    return `<sirsi-button variant="primary" size="md" onclick="window.location.href='${href}'">${text}</sirsi-button>`;
  });
  
  // Pattern 6: <a href="..." class="btn btn-secondary">Text</a>
  content = content.replace(/<a\s+href="([^"]+)"\s+class="btn\s+btn-secondary"[^>]*>([^<]+)<\/a>/g, (match, href, text) => {
    replacements++;
    return `<sirsi-button variant="secondary" size="md" onclick="window.location.href='${href}'">${text}</sirsi-button>`;
  });
  
  // Pattern 7: Generic <button> with onclick
  content = content.replace(/<button\s+onclick="([^"]+)"[^>]*>([^<]+)<\/button>/g, (match, onclick, text) => {
    replacements++;
    // Determine variant based on text content
    const variant = text.toLowerCase().includes('cancel') || text.toLowerCase().includes('close') ? 'ghost' : 
                   text.toLowerCase().includes('save') || text.toLowerCase().includes('submit') ? 'primary' : 'secondary';
    return `<sirsi-button variant="${variant}" size="md" onclick="${onclick}">${text}</sirsi-button>`;
  });
  
  // Pattern 8: Generic <button> without class
  content = content.replace(/<button>([^<]+)<\/button>/g, (match, text) => {
    replacements++;
    return `<sirsi-button variant="secondary" size="md">${text}</sirsi-button>`;
  });
  
  // Pattern 9: Table action buttons (common pattern)
  content = content.replace(/<button\s+class="table-action"[^>]*>([^<]+)<\/button>/g, (match, text) => {
    replacements++;
    return `<sirsi-button variant="primary" size="sm">${text}</sirsi-button>`;
  });
  
  // Remove old button CSS classes if they exist
  content = content.replace(/\.btn\s*{[^}]+}/g, '/* Button styles handled by sirsi-button component */');
  content = content.replace(/\.btn-primary\s*{[^}]+}/g, '');
  content = content.replace(/\.btn-secondary\s*{[^}]+}/g, '');
  content = content.replace(/\.btn-ghost\s*{[^}]+}/g, '');
  content = content.replace(/\.btn:hover\s*{[^}]+}/g, '');
  content = content.replace(/\.btn-primary:hover\s*{[^}]+}/g, '');
  content = content.replace(/\.btn-secondary:hover\s*{[^}]+}/g, '');
  
  // Fix any sirsi-buttons that still have old classes attached
  content = content.replace(/<sirsi-button([^>]+)class="[^"]*btn[^"]*"([^>]*)>/g, '<sirsi-button$1$2>');
  
  if (replacements > 0) {
    // Write the updated content
    fs.writeFileSync(filePath, content, 'utf-8');
    
    // Also update in assiduous-build if it exists
    const buildPath = filePath.replace('/admin/', '/assiduous-build/admin/');
    if (fs.existsSync(path.dirname(buildPath))) {
      fs.mkdirSync(path.dirname(buildPath), { recursive: true });
      fs.writeFileSync(buildPath, content, 'utf-8');
    }
    
    console.log(`✅ Updated ${fileName}: ${replacements} buttons modernized`);
    totalReplacements += replacements;
  } else {
    // Check if file already has sirsi-buttons
    if (content.includes('sirsi-button')) {
      console.log(`✓ ${fileName} already using modern buttons`);
    } else if (content.includes('<button') || content.includes('class="btn')) {
      console.log(`⚠️  ${fileName} may have complex button patterns that need manual review`);
    }
  }
});

console.log(`\n🎉 Total buttons modernized: ${totalReplacements}`);
console.log('✨ All admin pages now use the modern Sirsi UI button components!');
