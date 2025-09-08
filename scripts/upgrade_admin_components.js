#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const TARGETS = [path.join(ROOT, 'admin'), path.join(ROOT, 'assiduous-build', 'admin')];

function* walk(dir){
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries){
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (p.endsWith('.html')) yield p;
  }
}

function upgradeBadges(html){
  html = html.replace(/<span([^>]*class=["'][^"']*status[^"']*active[^"']*["'][^>]*)>(.*?)<\/span>/gmi,
    '<span class="sirsi-badge sirsi-badge--success">$2<\/span>');
  html = html.replace(/<span([^>]*class=["'][^"']*status[^"']*pending[^"']*["'][^>]*)>(.*?)<\/span>/gmi,
    '<span class="sirsi-badge sirsi-badge--warning">$2<\/span>');
  html = html.replace(/<span([^>]*class=["'][^"']*status[^"']*inactive[^"']*["'][^>]*)>(.*?)<\/span>/gmi,
    '<span class="sirsi-badge sirsi-badge--primary">$2<\/span>');
  return html;
}

let changed = 0;
for (const base of TARGETS){
  if (!fs.existsSync(base)) continue;
  for (const file of walk(base)){
    try {
      let html = fs.readFileSync(file, 'utf8');
      const orig = html;
      html = upgradeBadges(html);
      if (html !== orig){ fs.writeFileSync(file, html, 'utf8'); changed++; }
    } catch(e) {}
  }
}
console.log(`Admin components sweep complete. Files updated: ${changed}`);
