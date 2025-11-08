#!/usr/bin/env python3
"""
Migrate Admin Pages to UCS (Universal Component System)

This script converts hardcoded admin pages to use UCS template system:
- Extracts hardcoded sidebar HTML and replaces with @component directive
- Creates .template.html files from .html files
- Preserves all other content bit-for-bit
- Admin sidebar design remains the gold standard

Usage: python3 scripts/migrate_admin_to_ucs.py
"""

import os
import re
import sys
from pathlib import Path

# Admin page configurations
ADMIN_PAGES = [
    {"file": "dashboard.html", "active": "dashboard"},
    {"file": "analytics.html", "active": "analytics"},
    {"file": "market.html", "active": "market"},
    {"file": "properties.html", "active": "properties"},
    {"file": "property-detail.html", "active": "properties"},
    {"file": "property-form.html", "active": "properties"},
    {"file": "agents.html", "active": "agents"},
    {"file": "agent-approvals.html", "active": "agents"},
    {"file": "clients.html", "active": "clients"},
    {"file": "transactions.html", "active": "transactions"},
    {"file": "knowledge-base.html", "active": "knowledge"},
    {"file": "settings.html", "active": "settings"},
]

def extract_sidebar_section(html_content):
    """
    Extract the sidebar section from HTML content.
    Returns (before_sidebar, sidebar_html, after_sidebar, sidebar_type)
    sidebar_type: 'hardcoded' or 'js-loaded'
    """
    # Pattern 1: Hardcoded sidebar <aside class="sidebar" ...>...</aside>
    pattern_hardcoded = r'(<aside\s+class="sidebar"[^>]*>)(.*?)(</aside>)'
    match = re.search(pattern_hardcoded, html_content, re.DOTALL)
    
    if match:
        start = html_content.find(match.group(1))
        end = start + len(match.group(0))
        before = html_content[:start]
        sidebar = match.group(0)
        after = html_content[end:]
        return before, sidebar, after, 'hardcoded'
    
    # Pattern 2: JS-loaded sidebar <div id="sidebar-root" ...></div>
    pattern_js = r'(<div\s+id="sidebar-root"[^>]*>)(.*?)(</div>)'
    match = re.search(pattern_js, html_content, re.DOTALL)
    
    if match:
        start = html_content.find(match.group(1))
        end = start + len(match.group(0))
        before = html_content[:start]
        sidebar = match.group(0)
        after = html_content[end:]
        return before, sidebar, after, 'js-loaded'
    
    return None, None, None, None

def migrate_page(admin_dir, page_config):
    """Migrate a single admin page to UCS template format."""
    
    html_file = admin_dir / page_config["file"]
    template_file = admin_dir / page_config["file"].replace(".html", ".template.html")
    
    print(f"\n📄 Processing: {page_config['file']}")
    
    # Check if template already exists
    if template_file.exists():
        print(f"  ⚠️  Template already exists: {template_file.name}")
        return False
    
    # Read the HTML file
    if not html_file.exists():
        print(f"  ❌ File not found: {html_file}")
        return False
    
    with open(html_file, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    # Extract sidebar section
    before, sidebar_html, after, sidebar_type = extract_sidebar_section(html_content)
    
    if not sidebar_html:
        print(f"  ❌ Could not find sidebar section")
        return False
    
    print(f"  → Sidebar type: {sidebar_type}")
    
    # Extract data-active from sidebar if present
    active_match = re.search(r'data-active="([^"]+)"', sidebar_html)
    active_key = active_match.group(1) if active_match else page_config["active"]
    
    print(f"  → Active nav key: {active_key}")
    
    # Create UCS directive
    ucs_directive = f'<!-- @component:sidebar active="{active_key}" role="admin" -->'
    
    # Replace sidebar with directive
    # Keep indentation consistent
    indent = '        '
    template_content = before + f'{indent}{ucs_directive}\n' + after
    
    # If JS-loaded, also remove the sidebar.js script tag
    if sidebar_type == 'js-loaded':
        template_content = re.sub(
            r'\s*<script\s+src="[^"]*sidebar\.js"></script>',
            '',
            template_content
        )
        print(f"  → Removed sidebar.js script tag")
    
    # Write template file
    with open(template_file, 'w', encoding='utf-8') as f:
        f.write(template_content)
    
    print(f"  ✅ Created: {template_file.name}")
    print(f"  → Sidebar replaced with UCS directive")
    
    return True

def main():
    """Main migration function."""
    
    print("=" * 60)
    print("Admin Pages → UCS Migration")
    print("=" * 60)
    print("\nThis will convert admin pages to use UCS template system.")
    print("Hardcoded sidebars will be replaced with @component directives.\n")
    
    # Get project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    admin_dir = project_root / "public" / "admin"
    
    if not admin_dir.exists():
        print(f"❌ Admin directory not found: {admin_dir}")
        sys.exit(1)
    
    print(f"📁 Admin directory: {admin_dir}\n")
    
    # Migrate each page
    migrated = 0
    skipped = 0
    failed = 0
    
    for page_config in ADMIN_PAGES:
        result = migrate_page(admin_dir, page_config)
        if result:
            migrated += 1
        elif (admin_dir / page_config["file"].replace(".html", ".template.html")).exists():
            skipped += 1
        else:
            failed += 1
    
    # Summary
    print("\n" + "=" * 60)
    print("Migration Summary")
    print("=" * 60)
    print(f"✅ Migrated: {migrated}")
    print(f"⚠️  Skipped (already exists): {skipped}")
    print(f"❌ Failed: {failed}")
    print(f"📊 Total: {len(ADMIN_PAGES)}")
    
    if migrated > 0:
        print("\n✅ Migration complete!")
        print("\nNext steps:")
        print("1. Run: npm run ucs:build")
        print("2. Test admin pages in browser")
        print("3. Verify sidebar navigation works correctly")
    
    return 0 if failed == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
