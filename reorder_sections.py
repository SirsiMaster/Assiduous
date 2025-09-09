#!/usr/bin/env python3
"""
Reorder the landing page sections according to the improved flow:
1. Hero
2. Trust Indicators 
3. How It Works
4. Live Deals/Properties
5. Property Estimator
6. Platform Features
7. Dashboard Preview
8. Success Stories + Case Studies
9. Video Section
10. FAQ
11. Market Reports
12. Mobile App CTAs
13. CTA Section
"""

import re

# Read the current index.html
with open('/Users/thekryptodragon/Development/assiduous/index.html', 'r') as f:
    content = f.read()

# Find sections using comments and section tags
sections = {
    'header': (content.find('<!-- Header -->'), content.find('<!-- Signup Modal -->')),
    'signup_modal': (content.find('<!-- Signup Modal -->'), content.find('<!-- Hero Section -->')),
    'hero': (content.find('<!-- Hero Section -->'), content.find('<!-- Trust Indicators -->')),
    'trust': (content.find('<!-- Trust Indicators -->'), content.find('<!-- Subtle Transition -->')),
    'transition1': (content.find('<!-- Subtle Transition -->'), content.find('<!-- Interactive Property Estimator -->')),
    'estimator': (content.find('<!-- Interactive Property Estimator -->'), content.find('<!-- Platform Features Section -->')),
    'features': (content.find('<!-- Platform Features Section -->'), content.find('<!-- Dashboard Preview Section -->')),
    'dashboard': (content.find('<!-- Dashboard Preview Section -->'), content.find('<!-- Video Section -->')),
    'video': (content.find('<!-- Video Section -->'), content.find('<!-- How It Works Section')),
    'how_it_works': (content.find('<!-- How It Works Section'), content.find('<!-- Success Stories Section -->')),
    'success': (content.find('<!-- Success Stories Section -->'), content.find('<!-- Case Studies Section -->')),
    'case_studies': (content.find('<!-- Case Studies Section -->'), content.find('<!-- Live Deals Section -->')),
    'deals': (content.find('<!-- Live Deals Section -->'), content.find('<!-- Mobile App CTAs -->')),
    'mobile': (content.find('<!-- Mobile App CTAs -->'), content.find('<!-- Market Reports Section -->')),
    'reports': (content.find('<!-- Market Reports Section -->'), content.find('<!-- CTA Section -->')),
    'cta': (content.find('<!-- CTA Section -->'), content.find('<!-- FAQ Section -->')),
    'faq': (content.find('<!-- FAQ Section -->'), content.find('<!-- Footer -->')),
    'footer': (content.find('<!-- Footer -->'), content.find('<!-- Chat support moved')),
    'end_content': (content.find('<!-- Chat support moved'), len(content))
}

# Extract each section
extracted = {}
for name, (start, end) in sections.items():
    if start != -1 and end != -1:
        extracted[name] = content[start:end]
    elif start != -1:  # Last section
        extracted[name] = content[start:]

# Get the header part (everything before first section)
header_end = content.find('<!-- Header -->')
file_header = content[:header_end] if header_end != -1 else ""

# Create the new order
new_content = file_header

# Add sections in the new order
new_content += extracted.get('header', '')
new_content += extracted.get('signup_modal', '')
new_content += extracted.get('hero', '')
new_content += extracted.get('trust', '')
new_content += extracted.get('transition1', '')

# How It Works (moved up)
new_content += extracted.get('how_it_works', '')

# Live Deals (moved up)
new_content += extracted.get('deals', '')

# Property Estimator
new_content += extracted.get('estimator', '')

# Platform Features
new_content += extracted.get('features', '')

# Dashboard Preview
new_content += extracted.get('dashboard', '')

# Success Stories + Case Studies (grouped together)
new_content += extracted.get('success', '')
new_content += extracted.get('case_studies', '')

# Video Section
new_content += extracted.get('video', '')

# FAQ
new_content += extracted.get('faq', '')

# Market Reports
new_content += extracted.get('reports', '')

# Mobile App CTAs
new_content += extracted.get('mobile', '')

# CTA Section (final push)
new_content += extracted.get('cta', '')

# Footer and end content
new_content += extracted.get('footer', '')
new_content += extracted.get('end_content', '')

# Write the reordered content
with open('/Users/thekryptodragon/Development/assiduous/index.html', 'w') as f:
    f.write(new_content)

print("✅ Sections reordered successfully!")
print("\nNew order:")
print("1. Hero")
print("2. Trust Indicators")
print("3. How It Works")
print("4. Live Deals/Properties")
print("5. Property Estimator")
print("6. Platform Features")
print("7. Dashboard Preview")
print("8. Success Stories + Case Studies")
print("9. Video Section")
print("10. FAQ")
print("11. Market Reports")
print("12. Mobile App CTAs")
print("13. CTA Section")
