#!/usr/bin/env node

/**
 * Assiduous Universal Component System (UCS) - Build Script
 * 
 * This script processes .template.html files and injects components
 * with proper path resolution and token replacement.
 * 
 * Usage:
 *   node scripts/build-pages.js                    # Build all templates
 *   node scripts/build-pages.js --verify-only      # Verify without building
 *   NODE_ENV=staging node scripts/build-pages.js   # Build for specific env
 */

const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURATION
// ============================================

const config = require('../public/assiduous.config.js');
const registry = require('../public/components/registry.json');

const ENV = process.env.NODE_ENV || 'dev';
const VERIFY_ONLY = process.argv.includes('--verify-only');
const BASE_DIR = config.paths.base;
const PUBLIC_DIR = path.join(BASE_DIR, config.paths.public);
const COMPONENTS_DIR = path.join(BASE_DIR, config.paths.components);

// ============================================
// BUILD REPORT
// ============================================

const buildReport = {
  timestamp: new Date().toISOString(),
  environment: ENV,
  pages: { built: 0, skipped: 0, errors: 0, warnings: 0 },
  components: {},
  duration: 0,
  errors: [],
  warnings: []
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Calculate relative path from file to public root
 */
function calculateBasePath(filePath) {
  const relativePath = path.relative(PUBLIC_DIR, path.dirname(filePath));
  const depth = relativePath.split(path.sep).filter(p => p && p !== '.').length;
  
  if (depth === 0) return './';
  return '../'.repeat(depth);
}

/**
 * Calculate relative path from file to assets directory
 */
function calculateAssetsPath(filePath) {
  const basePath = calculateBasePath(filePath);
  return basePath + 'assets/';
}

/**
 * Check if file should be excluded from processing
 */
function shouldExclude(filePath) {
  const relativePath = path.relative(BASE_DIR, filePath);
  
  for (const pattern of config.build.patterns.exclude) {
    // Convert glob pattern to regex
    const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\//g, '\\/'));
    if (regex.test(relativePath)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Find all template files
 */
function findTemplateFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!shouldExclude(filePath)) {
        findTemplateFiles(filePath, fileList);
      }
    } else if (file.endsWith('.template.html')) {
      if (!shouldExclude(filePath)) {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
}

/**
 * Parse component directive from HTML comment
 * Example: <!-- @component:sidebar active="dashboard" role="admin" -->
 */
function parseDirective(comment) {
  const match = comment.match(/<!--\s*@component:(\w+)\s+(.+?)\s*-->/);
  if (!match) return null;
  
  const componentName = match[1];
  const propsString = match[2];
  
  // Parse props (simple key="value" parsing)
  const props = {};
  const propRegex = /(\w+)="([^"]+)"/g;
  let propMatch;
  
  while ((propMatch = propRegex.exec(propsString)) !== null) {
    props[propMatch[1]] = propMatch[2];
  }
  
  return { componentName, props };
}

/**
 * Load component template with role variant support
 */
function loadComponentTemplate(componentName, role) {
  const component = registry.components[componentName];
  
  if (!component) {
    throw new Error(`Component '${componentName}' not found in registry`);
  }
  
  // Determine which template file to use based on role
  let templateFile = component.template;
  
  // Check if component has role variants and if a role is specified
  if (role && component.roleVariants && component.roleVariants[role]) {
    templateFile = component.roleVariants[role];
    console.log(`    → Using role variant: ${templateFile} (role: ${role})`);
  }
  
  const templatePath = path.join(COMPONENTS_DIR, templateFile);
  
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Component template not found: ${templatePath}`);
  }
  
  return fs.readFileSync(templatePath, 'utf8');
}

/**
 * Replace tokens in template
 */
function replaceTokens(template, filePath, props) {
  let result = template;
  
  // Strip all HTML comments from component templates (documentation, usage notes)
  // This removes comments including those with newlines
  result = result.replace(/<!--[^]*?-->/g, '').trim();
  
  // Replace path tokens
  result = result.replace(/\{\{BASE_PATH\}\}/g, calculateBasePath(filePath));
  result = result.replace(/\{\{ASSETS_PATH\}\}/g, calculateAssetsPath(filePath));
  result = result.replace(/\{\{COMPONENTS_PATH\}\}/g, calculateBasePath(filePath) + 'components/');
  
  // Replace prop tokens
  Object.keys(props).forEach(key => {
    const token = `{{PROP_${key}}}`;
    result = result.replace(new RegExp(token, 'g'), props[key]);
  });
  
  // Replace role token if present
  if (props.role) {
    result = result.replace(/\{\{ROLE\}\}/g, props.role);
  }
  
  return result;
}

/**
 * Process a single template file
 */
function processTemplate(templatePath) {
  console.log(`Processing: ${path.relative(BASE_DIR, templatePath)}`);
  
  try {
    // Read template file
    let content = fs.readFileSync(templatePath, 'utf8');
    
    // Find all @component directives
    const directiveRegex = /<!--\s*@component:(\w+)\s+(.+?)\s*-->/g;
    let match;
    const components = [];
    
    while ((match = directiveRegex.exec(content)) !== null) {
      const directive = parseDirective(match[0]);
      if (directive) {
        components.push({
          fullMatch: match[0],
          ...directive
        });
      }
    }
    
    // Process each component
    components.forEach(({ fullMatch, componentName, props }) => {
      console.log(`  → Injecting ${componentName} component`);
      
      // Load component template (with role variant support)
      const componentTemplate = loadComponentTemplate(componentName, props.role);
      
      // Replace tokens
      let processedComponent = replaceTokens(componentTemplate, templatePath, props);
      
      // Wrap sidebar in <aside> tag with active class
      if (componentName === 'sidebar') {
        processedComponent = `<aside class="sidebar">${processedComponent}</aside>`;
      }
      
      // Replace directive with component HTML
      content = content.replace(fullMatch, processedComponent);
      
      // Track component usage
      const trackingKey = props.role ? `${componentName}:${props.role}` : componentName;
      buildReport.components[trackingKey] = (buildReport.components[trackingKey] || 0) + 1;
    });
    
    if (components.length === 0) {
      console.log('  ⚠ No components found in template');
      buildReport.warnings.push(`${templatePath}: No components found`);
      buildReport.pages.warnings++;
    }
    
    // Write output file
    if (!VERIFY_ONLY) {
      const outputPath = templatePath.replace('.template.html', '.html');
      fs.writeFileSync(outputPath, content, 'utf8');
      console.log(`  ✓ Built: ${path.relative(BASE_DIR, outputPath)}`);
    }
    
    buildReport.pages.built++;
    
  } catch (error) {
    console.error(`  ✗ Error: ${error.message}`);
    buildReport.errors.push(`${templatePath}: ${error.message}`);
    buildReport.pages.errors++;
  }
}

// ============================================
// MAIN BUILD PROCESS
// ============================================

function main() {
  console.log('=====================================');
  console.log('UCS Build System');
  console.log('=====================================');
  console.log(`Environment: ${ENV}`);
  console.log(`Mode: ${VERIFY_ONLY ? 'Verify Only' : 'Build'}`);
  console.log(`Base Dir: ${BASE_DIR}`);
  console.log('');
  
  const startTime = Date.now();
  
  try {
    // Find all template files
    console.log('Discovering template files...');
    const templateFiles = findTemplateFiles(PUBLIC_DIR);
    console.log(`Found ${templateFiles.length} template file(s)`);
    console.log('');
    
    if (templateFiles.length === 0) {
      console.log('⚠ No template files found. Create files with .template.html extension.');
      console.log('Example: public/docs/test.template.html');
      process.exit(0);
    }
    
    // Process each template
    templateFiles.forEach(processTemplate);
    
    // Calculate duration
    buildReport.duration = ((Date.now() - startTime) / 1000).toFixed(2) + 's';
    
    // Print summary
    console.log('');
    console.log('=====================================');
    console.log('Build Summary');
    console.log('=====================================');
    console.log(`✓ Built: ${buildReport.pages.built}`);
    console.log(`⚠ Warnings: ${buildReport.pages.warnings}`);
    console.log(`✗ Errors: ${buildReport.pages.errors}`);
    console.log(`Duration: ${buildReport.duration}`);
    console.log('');
    
    if (Object.keys(buildReport.components).length > 0) {
      console.log('Components Used:');
      Object.entries(buildReport.components).forEach(([name, count]) => {
        console.log(`  - ${name}: ${count}x`);
      });
      console.log('');
    }
    
    if (buildReport.warnings.length > 0) {
      console.log('Warnings:');
      buildReport.warnings.forEach(warning => console.log(`  ⚠ ${warning}`));
      console.log('');
    }
    
    if (buildReport.errors.length > 0) {
      console.log('Errors:');
      buildReport.errors.forEach(error => console.log(`  ✗ ${error}`));
      console.log('');
    }
    
    // Write build report
    if (!VERIFY_ONLY) {
      const reportPath = path.join(BASE_DIR, 'build-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(buildReport, null, 2), 'utf8');
      console.log(`Build report: ${reportPath}`);
    }
    
    // Exit with appropriate code
    if (buildReport.pages.errors > 0) {
      console.error('\n❌ Build failed with errors');
      process.exit(1);
    } else if (buildReport.pages.warnings > 0 && config.build.validation.failOnWarning) {
      console.error('\n❌ Build failed (warnings treated as errors in this environment)');
      process.exit(1);
    } else {
      console.log('\n✅ Build complete');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, processTemplate, calculateBasePath };
