#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const TARGETS = [
  path.join(ROOT, 'admin'),
  path.join(ROOT, 'assiduous-build', 'admin')
];

const JS_SNIPPET = '<script defer src="https://cdn.jsdelivr.net/gh/SirsiMaster/sirsi-ui@v0.1.2/dist/sirsi-ui.js"></script>';

function injectSirsiJS(html){
  if (html.includes(JS_SNIPPET)) return html;
  // inject before closing head or after last stylesheet link
  if (html.includes('</head>')) return html.replace('</head>', `    ${JS_SNIPPET}\n</head>`);
  return `${JS_SNIPPET}\n${html}`;
}

function upgradeButtons(html){
  // table-action button to sirsi-button
  html = html.replace(/<button([^>]*class=["'][^"']*table-action[^"']*["'][^>]*)>(.*?)<\/button>/gmi,
    '<sirsi-button variant="primary" size="sm" class="table-action"$1>$2</sirsi-button>');
  // btn-primary to sirsi-button primary
  html = html.replace(/<button([^>]*class=["'][^"']*btn-primary[^"']*["'][^>]*)>(.*?)<\/button>/gmi,
    '<sirsi-button variant="primary" size="md"$1>$2</sirsi-button>');
  return html;
}

function upgradeCards(html){
  // add sirsi-card to data-table and panels
  html = html.replace(/<div([^>]*class=["'][^"']*data-table[^"']*["'][^>]*)>/gmi, '<div class="data-table sirsi-card">');
  html = html.replace(/<div([^>]*class=["'][^"']*stat-card[^"']*["'][^>]*)>/gmi, '<div class="stat-card sirsi-card sirsi-card--elevated">');
  html = html.replace(/<div([^>]*class=["'][^"']*activity-feed[^"']*["'][^>]*)>/gmi, '<div class="activity-feed sirsi-card">');
  return html;
}

function upgradeFonts(html){
  // switch body font to Geist Sans if hardcoded Inter
  html = html.replace(/font-family:\s*'Inter'[^;]*;/g, 'font-family: "Geist Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif;');
  return html;
}

function processFile(file){
  let html = fs.readFileSync(file, 'utf8');
  const orig = html;
  html = injectSirsiJS(html);
  html = upgradeButtons(html);
  html = upgradeCards(html);
  html = upgradeFonts(html);
  if (html !== orig){
    fs.writeFileSync(file, html, 'utf8');
    return true;
  }
  return false;
}

function* walk(dir){
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries){
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (p.endsWith('.html')) yield p;
  }
}

let changed = 0;
for (const base of TARGETS){
  if (!fs.existsSync(base)) continue;
  for (const file of walk(base)){
    try { if (processFile(file)) changed++; } catch(e) {}
  }
}
console.log(`Admin UI upgrade complete. Files updated: ${changed}`);
