#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const IGNORE = ['node_modules', '.git', '.next', 'firebase-migration-package/y', 'firebase-migration-package/assiduous-build/.next'];

const SIRSI_CSS = '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/SirsiMaster/sirsi-ui@v0.1.2/dist/sirsi-ui.css">';
const INTER_REGEX = /<link[^>]*fonts\.googleapis[^>]*Inter[^>]*>/gi;
const OLD_TAGLINES = [/Intelligent Real Estate Solutions/gi, /Smart Real Estate Solutions/gi];

function shouldIgnore(p) {
  return IGNORE.some(seg => p.includes(seg));
}

function* walk(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const it of items) {
    const full = path.join(dir, it.name);
    if (shouldIgnore(full)) continue;
    if (it.isDirectory()) yield* walk(full);
    else yield full;
  }
}

function ensureSirsiCss(content) {
  if (content.includes(SIRSI_CSS)) return content;
  // insert before first generated.css or at end of head
  const headLink = content.match(/<link[^>]+>/i)?.[0];
  if (headLink) {
    return content.replace(headLink, headLink + '\n    ' + SIRSI_CSS);
  }
  return content.replace('</head>', '  ' + SIRSI_CSS + '\n</head>');
}

function processHtml(file) {
  let content = fs.readFileSync(file, 'utf8');
  let orig = content;
  // Remove Inter
  content = content.replace(INTER_REGEX, '');
  // Replace taglines
  for (const re of OLD_TAGLINES) content = content.replace(re, 'Your Micro-Flipping Path to Wealth');
  // Ensure Sirsi CSS
  content = ensureSirsiCss(content);
  if (content !== orig) {
    fs.writeFileSync(file, content, 'utf8');
    return true;
  }
  return false;
}

let changed = 0;
for (const file of walk(ROOT)) {
  if (file.endsWith('.html')) {
    try { if (processHtml(file)) changed++; } catch (e) { /* ignore */ }
  }
}
console.log(`Branding sweep complete. Updated files: ${changed}`);
