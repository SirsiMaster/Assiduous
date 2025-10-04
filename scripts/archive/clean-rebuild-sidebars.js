#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the clean sidebar template
let sidebarTemplateRaw = fs.readFileSync(path.join(__dirname, '../components/sidebar.html'), 'utf-8');
// Extract only the HTML content (everything after the comment)
let sidebarTemplate = sidebarTemplateRaw
  .substring(sidebarTemplateRaw.indexOf('-->') + 3)
  .trim();

// Function to get the correct base path for each file
function getBasePath(filePath) {
  const relativePath = path.relative(path.join(__dirname, '../'), filePath);
  
  if (relativePath.includes('admin/development/')) {
    return '../';
  } else if (relativePath.includes('admin/contracts/')) {
    return '../';
  } else if (relativePath.includes('admin/')) {
    return '';
  }
  return 'admin/';
}

// Function to process sidebar template with correct paths
function processSidebar(filePath, activeKey) {
  const basePath = getBasePath(filePath);
  let processed = sidebarTemplate.replace(/\[\[BASE\]\]/g, basePath);
  
  // Add the sidebar wrapper and active state
  processed = `<aside class="sidebar" id="sidebar-root" data-active="${activeKey}">
${processed}
</aside>`;
  
  // Add active class to the correct menu item
  if (activeKey) {
    // Fix the active class insertion
    const dataKeyPattern = new RegExp(`data-key="${activeKey}"`, 'g');
    processed = processed.replace(dataKeyPattern, `data-key="${activeKey}" class="nav-item active"`);
    // Remove duplicate class attributes
    processed = processed.replace(/class="nav-item"\s+class="nav-item active"/g, 'class="nav-item active"');
  }
  
  return processed;
}

// Admin pages configuration
const adminPages = [
  { file: 'admin/dashboard.html', activeKey: 'dashboard' },
  { file: 'admin/analytics.html', activeKey: 'analytics' },
  { file: 'admin/properties.html', activeKey: 'properties' },
  { file: 'admin/agents.html', activeKey: 'agents' },
  { file: 'admin/clients.html', activeKey: 'clients' },
  { file: 'admin/transactions.html', activeKey: 'transactions' },
  { file: 'admin/market.html', activeKey: 'market' },
  { file: 'admin/settings.html', activeKey: 'settings' },
  { file: 'admin/knowledge-base.html', activeKey: 'knowledge' },
  { file: 'admin/development/dashboard.html', activeKey: 'dev-dashboard' },
  { file: 'admin/development/analytics.html', activeKey: 'dev-analytics' },
  { file: 'admin/development/costs.html', activeKey: 'dev-costs' },
  { file: 'admin/development/reports.html', activeKey: 'dev-reports' },
  { file: 'admin/development/docs.html', activeKey: 'dev-docs' },
  { file: 'admin/contracts/index.html', activeKey: 'contracts' },
  { file: 'admin/contracts/sirsi_contract.html', activeKey: 'contracts' },
  { file: 'admin/contracts/payment_structure.html', activeKey: 'contracts' }
];

// Process each admin page
adminPages.forEach(({ file, activeKey }) => {
  const filePath = path.join(__dirname, '../', file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Generate the processed sidebar
  const newSidebar = processSidebar(filePath, activeKey);
  
  // COMPLETE CLEANUP: Remove ALL existing sidebar content
  // This matches from any <aside> tag to right before <main> or end of admin-wrapper
  content = content.replace(
    /<aside[^>]*id="sidebar-root"[^>]*>[\s\S]*?(?=<main|<\/div>\s*<\/body>)/g,
    ''
  );
  
  // Remove any orphaned comment text and duplicate sidebar content
  content = content.replace(
    /<!--\s*Sidebar Component\s*-->[\s\S]*?(?=<main|<\/div>\s*<\/body>)/g,
    ''
  );
  
  // Remove the broken tokens text
  content = content.replace(
    /Tokens:[\s\S]*?This template is portable across all admin pages\.\s*-->/g,
    ''
  );
  
  // Remove any duplicate sidebar header/nav elements that might be floating around
  content = content.replace(
    /<div class="sidebar-header">[\s\S]*?<\/nav>\s*/g,
    ''
  );
  
  // Remove the sidebar.js script tag (no longer needed)
  content = content.replace(
    /<script[^>]*src="[^"]*sidebar\.js"[^>]*><\/script>/g,
    '<!-- Sidebar pre-rendered, no JS needed -->'
  );
  
  // Now insert the clean sidebar in the right place
  content = content.replace(
    /(<div class="admin-wrapper">\s*)/,
    `$1
        <!-- Sidebar Component -->
        ${newSidebar}
        `
  );
  
  // Write the updated content back
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✅ Cleaned and rebuilt: ${file}`);
  
  // Also update in assiduous-build
  const buildPath = path.join(__dirname, '../assiduous-build/', file);
  if (fs.existsSync(path.dirname(buildPath))) {
    fs.mkdirSync(path.dirname(buildPath), { recursive: true });
    fs.writeFileSync(buildPath, content, 'utf-8');
  }
});

console.log('\n✅ All admin pages have been cleaned and rebuilt!');
console.log('🎯 Sidebars are now clean, properly rendered, and flicker-free!');
