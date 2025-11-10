#!/usr/bin/env python3
"""
Fix malformed sidebar HTML in client and agent portal pages.
Ensures all pages have proper UCS structure:
- <body class="admin-wrapper" data-active="dashboard">
-     <!-- UCS Sidebar Component -->
-     <aside class="sidebar" data-component="sidebar"></aside>
-     <div class="main-content">
-         <header data-component="header"></header>
-         ...
"""

import re
import os
from pathlib import Path

def fix_page(filepath):
    """Fix a single HTML page."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if already has correct structure (dashboard-ucs.html pattern)
    if'<body class="admin-wrapper" data-active="dashboard">\n    <!-- UCS Sidebar Component -->\n    <aside class="sidebar" data-component="sidebar"' in content:
        print(f"✓ {filepath} already correct")
        return False
    
    # Remove duplicate/malformed aside tags
    content = re.sub(r'<aside class="sidebar" data-component="sidebar"></aside></aside>', '', content)
    content = re.sub(r'<aside data-component="sidebar"></aside></aside>', '', content)
    
    # Fix body tag structure
    # Pattern 1: <body>\n<aside...
    content = re.sub(
        r'(<body[^>]*>)\s*<aside[^>]*data-component="sidebar"[^>]*></aside>',
        r'\1\n    <!-- UCS Sidebar Component -->\n    <aside class="sidebar" data-component="sidebar"></aside>',
        content
    )
    
    # Pattern 2: <body>\n    <div class="admin-wrapper">\n        \n        <!-- ... -->\n        <aside...
    content = re.sub(
        r'(<body[^>]*>)\s*<div class="admin-wrapper">\s*<!--[^>]*-->\s*<aside[^>]*data-component="sidebar"[^>]*></aside>\s*</aside>',
        r'\1\n    <!-- UCS Sidebar Component -->\n    <aside class="sidebar" data-component="sidebar"></aside>\n\n    <!-- Main Content Area -->\n    <div class="main-content">',
        content
    )
    
    # Pattern 3: Ensure main-content div exists
    if '<div class="main-content">' not in content and '<main class="main-content">' not in content:
        content = re.sub(
            r'(<aside class="sidebar" data-component="sidebar"></aside>)\s*<main',
            r'\1\n\n    <!-- Main Content Area -->\n    <div class="main-content">\n        <main',
            content
        )
    
    # Ensure body has admin-wrapper class and data-active
    if 'class="admin-wrapper"' not in content:
        content = re.sub(
            r'<body>',
            r'<body class="admin-wrapper" data-active="dashboard">',
            content
        )
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✓ Fixed {filepath}")
    return True

def main():
    base_dir = Path('/Users/thekryptodragon/Development/assiduous/public')
    
    # Files to fix (excluding templates and dashboard-ucs.html which is correct)
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
