#!/usr/bin/env python3
import os
import re
from pathlib import Path

dev_dir = Path('public/admin/development')
pages = [
    {'file': 'dashboard.html', 'active': 'dev-dashboard'},
    {'file': 'analytics.html', 'active': 'dev-analytics'},
    {'file': 'costs.html', 'active': 'dev-costs'},
    {'file': 'reports.html', 'active': 'dev-reports'},
    {'file': 'docs.html', 'active': 'dev-docs'},
]

for page in pages:
    html_file = dev_dir / page['file']
    template_file = dev_dir / (page['file'].replace('.html', '.template.html'))
    
    if template_file.exists():
        print(f'Skip: {page["file"]} (exists)')
        continue
    
    if not html_file.exists():
        print(f'Missing: {page["file"]}')
        continue
    
    with open(html_file, 'r') as f:
        content = f.read()
    
    # Check for sidebar patterns
    if '<div id="sidebar-root"' in content:
        # JS-loaded sidebar
        pattern = r'<div id="sidebar-root"[^>]*></div>'
        directive = f'<!-- @component:sidebar active="{page["active"]}" role="admin" -->'
        content = re.sub(pattern, '        ' + directive, content)
        # Remove sidebar.js
        content = re.sub(r'\s*<script\s+src="[^"]*sidebar\.js"></script>', '', content)
        sidebar_type = 'js-loaded'
    elif '<aside class="sidebar"' in content:
        # Hardcoded sidebar
        pattern = r'<aside\s+class="sidebar"[^>]*>.*?</aside>'
        directive = f'<!-- @component:sidebar active="{page["active"]}" role="admin" -->'
        content = re.sub(pattern, '        ' + directive, content, flags=re.DOTALL)
        sidebar_type = 'hardcoded'
    else:
        print(f'No sidebar: {page["file"]}')
        continue
    
    with open(template_file, 'w') as f:
        f.write(content)
    
    print(f'✅ Migrated: {page["file"]} ({sidebar_type})')

print('Development pages migration complete!')
