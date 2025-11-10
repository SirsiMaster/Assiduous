#!/usr/bin/env python3
"""
Completely rebuild broken portal pages using correct UCS structure from index.html.
Extracts page-specific content and rebuilds with proper HTML structure.
"""

import re
from pathlib import Path

# Correct UCS structure template
UCS_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    
    <!-- Assiduous Design System -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/SirsiMaster/ui-components@latest/dist/sirsimaster-ui.css">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/@fontsource/geist-sans@5.0.6/latin.css" rel="stylesheet">
    
    <link rel="stylesheet" href="../assiduous.css">
    <link rel="stylesheet" href="../components/admin-layout.css">
    
    <style>
{page_styles}
    </style>
</head>
<body class="admin-wrapper" data-active="{data_active}">
    <!-- UCS Sidebar Component -->
    <aside class="sidebar" data-component="sidebar"></aside>

    <!-- Main Content Area -->
    <div class="main-content">
        <!-- UCS Header Component -->
        <header data-component="header"></header>

        <!-- Dashboard Content -->
        <div class="dashboard-content">
{page_content}
        </div>
    </div>

    <!-- UCS Core Scripts -->
    <script src="../components/ucs-core.js"></script>
    <script src="../components/component-registry.js"></script>
{page_scripts}
</body>
</html>
"""

def extract_content_between(html, start_marker, end_marker):
    """Extract content between two markers."""
    start_idx = html.find(start_marker)
    if start_idx == -1:
        return ""
    start_idx += len(start_marker)
    
    end_idx = html.find(end_marker, start_idx)
    if end_idx == -1:
        return ""
    
    return html[start_idx:end_idx].strip()

def extract_page_styles(html):
    """Extract page-specific styles from <style> block."""
    styles = []
    
    # Find all style blocks
    for match in re.finditer(r'<style>(.*?)</style>', html, re.DOTALL):
        content = match.group(1)
        
        # Skip duplicate admin-layout.css styles
        skip_patterns = [
            'Admin Layout', 'body {', '.admin-wrapper', '.sidebar', 
            '.nav-item', '.main-content', '.topbar', 'Consistent across'
        ]
        
        if not any(pattern in content for pattern in skip_patterns):
            styles.append(content.strip())
    
    return '\n\n'.join(styles) if styles else '        /* Page-specific styles */'

def extract_page_content(html):
    """Extract main page content (after headers, inside page wrapper)."""
    # Try multiple patterns to find content
    patterns = [
        (r'<div class="page-content">(.*?)</div>\s*</main>', re.DOTALL),
        (r'<div class="dashboard-content">(.*?)</div>\s*</div>\s*</div>', re.DOTALL),
        (r'<div class="page-content">(.*?)</div>\s*</div>\s*</div>', re.DOTALL),
    ]
    
    for pattern, flags in patterns:
        match = re.search(pattern, html, flags)
        if match:
            content = match.group(1).strip()
            # Remove duplicate header tags
            content = re.sub(r'<header data-component="header"></header>\s*', '', content)
            return content
    
    return '            <h1 class="page-title">Page Content</h1>\n            <p>Content extraction failed - manual fix needed</p>'

def extract_page_scripts(html):
    """Extract page-specific JavaScript (excluding UCS scripts)."""
    scripts = []
    
    # Find script blocks after UCS scripts
    in_body = False
    for line in html.split('\n'):
        if '<body' in line:
            in_body = True
        elif '</body>' in line:
            break
        elif in_body and '<script' in line and 'ucs-core' not in line and 'component-registry' not in line:
            # Start capturing script
            script_content = []
            capture = True
            
    # Better approach: extract script blocks
    script_matches = re.finditer(r'(<script[^>]*>.*?</script>)', html, re.DOTALL)
    for match in script_matches:
        script = match.group(1)
        if 'ucs-core' not in script and 'component-registry' not in script:
            scripts.append('    ' + script)
    
    return '\n'.join(scripts) if scripts else ''

def get_title_from_filename(filename, role):
    """Generate proper title from filename."""
    name = filename.stem.replace('-', ' ').title()
    role_name = role.capitalize()
    return f"{name} - Assiduous {role_name} Portal"

def get_data_active(filename):
    """Get data-active attribute from filename."""
    return filename.stem

def rebuild_page(filepath, role):
    """Rebuild a single page with correct UCS structure."""
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()
    
    # Skip if already correct (has exactly 1 header and no template vars)
    header_count = html.count('<header data-component="header"></header>')
    has_templates = '{{BASE_PATH}}' in html
    
    if header_count == 1 and not has_templates and 'Admin Portal' not in html:
        return False
    
    # Extract components
    title = get_title_from_filename(filepath, role)
    data_active = get_data_active(filepath)
    page_styles = extract_page_styles(html)
    page_content = extract_page_content(html)
    page_scripts = extract_page_scripts(html)
    
    # Build new page
    new_html = UCS_TEMPLATE.format(
        title=title,
        data_active=data_active,
        page_styles=page_styles,
        page_content=page_content,
        page_scripts=page_scripts
    )
    
    # Write rebuilt page
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_html)
    
    return True

def main():
    base_dir = Path('/Users/thekryptodragon/Development/assiduous/public')
    
    # Pages to rebuild (exclude index.html and dashboard-ucs.html which work)
    pages = {
        'client': [
            'deal-analyzer.html',
            'documents.html',
            'messages.html',
            'micro-flip-calculator.html',
            'onboarding.html',
            'properties.html',
            'property-detail.html',
            'property-tax-records.html',
            'saved.html',
            'viewings.html',
            'dashboard.html',  # Also broken
        ],
        'agent': [
            'clients.html',
            'commissions.html',
            'leads.html',
            'listings.html',
            'schedule.html',
            'dashboard.html',  # Also broken
        ]
    }
    
    rebuilt_count = 0
    
    for role, files in pages.items():
        print(f"\n=== Rebuilding {role} pages ===")
        for filename in files:
            filepath = base_dir / role / filename
            if filepath.exists():
                if rebuild_page(filepath, role):
                    print(f"✓ Rebuilt {filepath}")
                    rebuilt_count += 1
                else:
                    print(f"  {filepath} already correct")
            else:
                print(f"✗ {filepath} not found")
    
    print(f"\n✅ Rebuilt {rebuilt_count} pages")
    print("\n⚠️  Manual verification needed:")
    print("  - Check page content renders correctly")
    print("  - Verify page-specific functionality works")
    print("  - Test in browser before deploying")

if __name__ == '__main__':
    main()
