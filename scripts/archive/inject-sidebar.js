#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the sidebar template
let sidebarTemplateRaw = fs.readFileSync(path.join(__dirname, '../components/sidebar.html'), 'utf-8');
// Extract only the HTML content (remove ALL comments)
let sidebarTemplate = sidebarTemplateRaw
  .split('-->').slice(1).join('') // Remove everything before first comment close
  .trim();

// Function to get the correct base path for each file
function getBasePath(filePath) {
  const relativePath = path.relative(path.join(__dirname, '../'), filePath);
  const depth = relativePath.split(path.sep).length - 1;
  
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
    const regex = new RegExp(`(data-key="${activeKey}"[^>]*>)`, 'g');
    processed = processed.replace(regex, '$1');
    // Now add the active class
    processed = processed.replace(
      new RegExp(`(<a[^>]*data-key="${activeKey}"[^>]*class="nav-item)(")`),
      '$1 active$2'
    );
    // If no class exists, add it
    processed = processed.replace(
      new RegExp(`(<a[^>]*data-key="${activeKey}"[^>]*)>`),
      '$1 class="nav-item active">'
    );
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
  
  // Replace the existing sidebar - handle all possible states
  // First, remove any existing sidebar and its duplicated/broken content
  // This regex captures everything from <aside> to the last </nav> before main content
  content = content.replace(
    /<aside[^>]*id="sidebar-root"[^>]*>[\s\S]*?<\/nav>[\s\S]*?(?=<main|<!-- Sidebar pre-rendered|$)/g,
    ''
  );
  
  // Now insert the clean sidebar
  content = content.replace(
    /(<div class="admin-wrapper">\s*)/,
    '$1' + newSidebar + '\n        '
  );
  
  // Pattern 2: Remove the sidebar.js script tag (no longer needed)
  content = content.replace(
    /<script[^>]*src="[^"]*sidebar\.js"[^>]*><\/script>/g,
    '<!-- Sidebar pre-rendered, no JS needed -->'
  );
  
  // Write the updated content back
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✅ Updated: ${file}`);
  
  // Also update in assiduous-build
  const buildPath = path.join(__dirname, '../assiduous-build/', file);
  if (fs.existsSync(path.dirname(buildPath))) {
    fs.mkdirSync(path.dirname(buildPath), { recursive: true });
    fs.writeFileSync(buildPath, content, 'utf-8');
  }
});

console.log('\n✅ All admin pages updated with pre-rendered sidebars!');
console.log('🚀 No more flicker - sidebars are now instantly visible!');
