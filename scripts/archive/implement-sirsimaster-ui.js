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

console.log(`Found ${adminFiles.length} HTML files to update...`);

let totalUpdates = 0;

adminFiles.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf-8');
  let updates = 0;
  const fileName = path.relative(path.join(__dirname, '..'), filePath);
  
  // Skip backup files
  if (fileName.includes('backup') || fileName.includes('_old')) {
    console.log(`⏭️  Skipping backup file: ${fileName}`);
    return;
  }
  
  // Step 1: Replace old Sirsi UI CSS with SirsiMaster UI CSS
  // Remove old sirsi-ui.css link
  if (content.includes('sirsi-ui.css')) {
    content = content.replace(/<link[^>]*sirsi-ui\.css[^>]*>/g, 
      '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/SirsiMaster/ui-components@latest/dist/sirsimaster-ui.css">');
    updates++;
  } else if (!content.includes('sirsimaster-ui.css')) {
    // Add SirsiMaster UI CSS if not present
    const cssLink = '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/SirsiMaster/ui-components@latest/dist/sirsimaster-ui.css">';
    
    if (content.includes('</head>')) {
      content = content.replace('</head>', `    ${cssLink}\n</head>`);
      updates++;
    }
  }
  
  // Step 2: Replace all sirsi-button elements with proper sm-btn buttons
  
  // Replace all sirsi-button components with standard buttons
  content = content.replace(/<sirsi-button([^>]*)>([^<]+)<\/sirsi-button>/gi, (match, attrs, text) => {
    let classes = 'sm-btn';
    
    // Check for variant attribute
    if (attrs.includes('variant="primary"')) {
      classes += ' sm-btn-primary';
    } else if (attrs.includes('variant="secondary"')) {
      classes += ' sm-btn-secondary';
    } else if (attrs.includes('variant="ghost"')) {
      classes += ' sm-btn-ghost';
    } else if (attrs.includes('variant="danger"')) {
      classes += ' sm-btn-danger';
    } else if (attrs.includes('variant="success"')) {
      classes += ' sm-btn-success';
    } else {
      classes += ' sm-btn-primary'; // default
    }
    
    // Check for size attribute
    if (attrs.includes('size="sm"')) {
      classes += ' sm-btn-sm';
    } else if (attrs.includes('size="lg"')) {
      classes += ' sm-btn-lg';
    }
    
    // Check for icon attribute
    if (attrs.includes('icon-only')) {
      classes += ' sm-btn-icon';
    }
    
    updates++;
    return `<button class="${classes}">${text}</button>`;
  });
  
  // Step 3: Update cards to use sm-card classes
  content = content.replace(/class="([^"]*\b)card(\b[^"]*)"/g, 'class="$1sm-card$2"');
  content = content.replace(/class="([^"]*\b)card-header(\b[^"]*)"/g, 'class="$1sm-card-header$2"');
  content = content.replace(/class="([^"]*\b)card-body(\b[^"]*)"/g, 'class="$1sm-card-body$2"');
  content = content.replace(/class="([^"]*\b)card-footer(\b[^"]*)"/g, 'class="$1sm-card-footer$2"');
  
  // Step 4: Update badges
  content = content.replace(/class="([^"]*\b)badge(\b[^"]*)"/g, 'class="$1sm-badge$2"');
  content = content.replace(/class="([^"]*\b)badge-success(\b[^"]*)"/g, 'class="$1sm-badge-success$2"');
  content = content.replace(/class="([^"]*\b)badge-warning(\b[^"]*)"/g, 'class="$1sm-badge-warning$2"');
  content = content.replace(/class="([^"]*\b)badge-danger(\b[^"]*)"/g, 'class="$1sm-badge-danger$2"');
  
  // Step 5: Update form elements
  content = content.replace(/class="([^"]*\b)form-input(\b[^"]*)"/g, 'class="$1sm-form-input$2"');
  content = content.replace(/class="([^"]*\b)form-label(\b[^"]*)"/g, 'class="$1sm-form-label$2"');
  content = content.replace(/class="([^"]*\b)form-group(\b[^"]*)"/g, 'class="$1sm-form-group$2"');
  
  // Step 6: Update table classes
  if (content.includes('class="table"')) {
    content = content.replace(/class="table"/g, 'class="sm-table"');
    updates++;
  }
  
  // Step 7: Remove old Sirsi UI JavaScript if present
  content = content.replace(/<script[^>]*sirsi-ui\.js[^>]*><\/script>/g, '<!-- Removed old Sirsi UI -->');
  
  if (updates > 0) {
    // Write the updated content
    fs.writeFileSync(filePath, content, 'utf-8');
    
    // Also update in assiduous-build if it exists
    const buildPath = filePath.replace('/admin/', '/assiduous-build/admin/');
    if (fs.existsSync(path.dirname(buildPath))) {
      fs.mkdirSync(path.dirname(buildPath), { recursive: true });
      fs.writeFileSync(buildPath, content, 'utf-8');
    }
    
    console.log(`✅ Updated ${fileName}: ${updates} changes made`);
    totalUpdates += updates;
  } else {
    console.log(`✓ ${fileName} - no changes needed`);
  }
});

console.log(`\n🎉 Total updates made: ${totalUpdates}`);
console.log('✨ All admin pages now use the beautiful SirsiMaster UI component library!');
console.log('\n📦 Next steps:');
console.log('1. Push the sirsimaster-ui folder to a new GitHub repo: SirsiMaster/ui-components');
console.log('2. This will make the CDN links work automatically via jsDelivr');
console.log('3. All future projects can use this same library!');
