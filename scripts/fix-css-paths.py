#!/usr/bin/env python3
"""
Fix CSS paths in portal pages:
1. Replace {{BASE_PATH}} template variables with proper relative paths
2. Remove duplicate inline CSS that's already in admin-layout.css
3. Ensure proper CDN links for sirsimaster-ui
"""

import re
from pathlib import Path

def fix_css_links(content):
    """Fix CSS link paths."""
    # Replace template variables with proper paths
    content = content.replace('{{BASE_PATH}}assets/vendor/sirsimaster-ui/sirsimaster-ui.css', 
                            'https://cdn.jsdelivr.net/gh/SirsiMaster/ui-components@latest/dist/sirsimaster-ui.css')
    content = content.replace('{{BASE_PATH}}assiduous.css', '../assiduous.css')
    content = content.replace('{{BASE_PATH}}components/admin-layout.css', '../components/admin-layout.css')
    
    # Fix crossorigin attribute
    content = content.replace('crossorigin">', 'crossorigin>')
    
    # Add missing font links if not present
    if 'DM+Serif+Display' not in content:
        content = re.sub(
            r'(<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>)',
            r'\1\n    <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap" rel="stylesheet">\n    <link href="https://cdn.jsdelivr.net/npm/@fontsource/geist-sans@5.0.6/index.css" rel="stylesheet">',
            content
        )
    
    return content

def remove_duplicate_css(content):
    """Remove inline CSS that duplicates admin-layout.css."""
    
    # Patterns to remove (these are in admin-layout.css)
    duplicate_patterns = [
        # Admin wrapper styles
        r'\.admin-wrapper\s*\{[^}]+\}',
        # Sidebar styles  
        r'\.sidebar\s*\{[^}]+\}',
        r'\.sidebar-header\s*\{[^}]+\}',
        r'\.sidebar-logo[^{]*\{[^}]+\}',
        r'\.sidebar-logo-text\s*\{[^}]+\}',
        r'\.sidebar-nav\s*\{[^}]+\}',
        r'\.nav-section[^{]*\{[^}]+\}',
        r'\.nav-section-title\s*\{[^}]+\}',
        r'\.nav-item[^{]*\{[^}]+\}',
        r'\.nav-icon\s*\{[^}]+\}',
        # Main content styles
        r'\.main-content\s*\{[^}]+\}',
        # Topbar styles
        r'\.topbar[^{]*\{[^}]+\}',
        r'\.topbar-left\s*\{[^}]+\}',
        r'\.topbar-actions\s*\{[^}]+\}',
        # Search bar styles
        r'\.search-bar\s*\{[^}]+\}',
        r'\.search-input[^-][^{]*\{[^}]+\}',
        # User avatar
        r'\.user-avatar\s*\{[^}]+\}',
        # Generic body styles in inline CSS
        r'body\s*\{\s*margin:\s*0;[^}]+\}',
    ]
    
    for pattern in duplicate_patterns:
        content = re.sub(pattern, '', content, flags=re.DOTALL)
    
    # Clean up empty style blocks and extra whitespace
    content = re.sub(r'<style>\s*/\*[^*]*\*/\s*</style>', '', content)
    content = re.sub(r'<style>\s*</style>', '', content)
    
    # Clean up comments about "Admin Layout" or "Consistent across"
    content = re.sub(r'/\*\s*Admin Layout[^*]*\*/', '', content)
    content = re.sub(r'/\*\s*Removed legacy[^*]*\*/', '', content)
    
    return content

def fix_page(filepath):
    """Fix a single page."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Fix CSS paths
    content = fix_css_links(content)
    
    # Remove duplicate CSS
    content = remove_duplicate_css(content)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✓ Fixed {filepath}")
        return True
    else:
        print(f"  {filepath} already correct")
        return False

def main():
    base_dir = Path('/Users/thekryptodragon/Development/assiduous/public')
    
    # All portal pages (excluding templates and already-working index.html)
    files = [
        'client/deal-analyzer.html',
        'client/documents.html',
        'client/messages.html',
        'client/micro-flip-calculator.html',
        'client/onboarding.html',
        'client/properties.html',
        'client/property-detail.html',
        'client/property-tax-records.html',
        'client/saved.html',
        'client/viewings.html',
        'agent/clients.html',
        'agent/commissions.html',
        'agent/leads.html',
        'agent/listings.html',
        'agent/schedule.html',
    ]
    
    fixed_count = 0
    for file in files:
        filepath = base_dir / file
        if filepath.exists():
            if fix_page(filepath):
                fixed_count += 1
        else:
            print(f"✗ {filepath} not found")
    
    print(f"\n✅ Fixed {fixed_count} files")

if __name__ == '__main__':
    main()
