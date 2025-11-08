#!/usr/bin/env python3
"""
Batch convert client and agent pages to use Universal Component System (UCS)
Replaces hardcoded sidebar/header HTML with UCS component placeholders
"""

import os
import re
from pathlib import Path

# Base directory
BASE_DIR = Path("/Users/thekryptodragon/Development/assiduous/public")

# Pages to convert
CLIENT_PAGES = [
    "deal-analyzer.html",
    "documents.html", 
    "messages.html",
    "micro-flip-calculator.html",
    "onboarding.html",
    "properties.html",
    "property-detail.html",
    "property-tax-records.html",
    "saved.html",
    "viewings.html"
]

AGENT_PAGES = [
    "clients.html",
    "commissions.html",
    "leads.html",
    "listings.html",
    "schedule.html"
]

UCS_SIDEBAR = '<aside class="sidebar" data-component="sidebar"></aside>'
UCS_HEADER = '<header data-component="header"></header>'
UCS_SCRIPTS = '''
    <!-- UCS Core Scripts -->
    <script src="../components/ucs-core.js"></script>
    <script src="../components/component-registry.js"></script>'''

def convert_page(filepath):
    """Convert a single page to use UCS"""
    print(f"Converting: {filepath}")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if already converted
    if 'data-component="sidebar"' in content:
        print(f"  ⏭️  Already converted, skipping...")
        return False
    
    # Remove hardcoded sidebar (from <aside or <nav to closing tag)
    # Look for sidebar HTML between <body> and main content
    content = re.sub(
        r'<(?:aside|nav)[^>]*(?:class="[^"]*sidebar[^"]*"|id="[^"]*sidebar[^"]*")[^>]*>.*?</(?:aside|nav)>',
        UCS_SIDEBAR,
        content,
        flags=re.DOTALL
    )
    
    # Remove hardcoded header/topbar
    content = re.sub(
        r'<(?:header|div)[^>]*(?:class="[^"]*(?:topbar|admin-topbar|header)[^"]*"|id="[^"]*(?:topbar|header)[^"]*")[^>]*>.*?</(?:header|div)>',
        UCS_HEADER,
        content,
        flags=re.DOTALL | re.MULTILINE
    )
    
    # Add UCS scripts before closing </body> if not already there
    if 'ucs-core.js' not in content:
        content = content.replace('</body>', UCS_SCRIPTS + '\n</body>')
    
    # Ensure proper structure: <body class="admin-wrapper">
    if 'class="admin-wrapper"' not in content:
        content = re.sub(
            r'<body([^>]*)>',
            r'<body\1 class="admin-wrapper">',
            content
        )
    
    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"  ✅ Converted successfully")
    return True

def main():
    print("=" * 60)
    print("UCS Batch Conversion Script")
    print("=" * 60)
    
    converted_count = 0
    
    # Convert client pages
    print(f"\n📱 Converting {len(CLIENT_PAGES)} client pages...")
    for page in CLIENT_PAGES:
        filepath = BASE_DIR / "client" / page
        if filepath.exists():
            if convert_page(filepath):
                converted_count += 1
        else:
            print(f"  ⚠️  File not found: {page}")
    
    # Convert agent pages  
    print(f"\n👔 Converting {len(AGENT_PAGES)} agent pages...")
    for page in AGENT_PAGES:
        filepath = BASE_DIR / "agent" / page
        if filepath.exists():
            if convert_page(filepath):
                converted_count += 1
        else:
            print(f"  ⚠️  File not found: {page}")
    
    print("\n" + "=" * 60)
    print(f"✅ Conversion complete: {converted_count} pages converted")
    print("=" * 60)

if __name__ == "__main__":
    main()
