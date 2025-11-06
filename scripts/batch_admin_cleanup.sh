#!/bin/bash

# Batch Admin Page Cleanup Script
# Removes embedded sidebars and standardizes all admin pages

cd /Users/thekryptodragon/Development/assiduous/public/admin

echo "🚀 Starting batch admin page cleanup..."
echo ""

# List of pages to clean
PAGES=(
    "properties.html"
    "agents.html"
    "clients.html"
    "transactions.html"
    "agent-approvals.html"
    "property-detail.html"
    "property-form.html"
    "settings.html"
    "knowledge-base.html"
)

for page in "${PAGES[@]}"; do
    if [ -f "$page" ]; then
        echo "📄 Processing $page..."
        
        # Backup original
        cp "$page" "${page}.backup_$(date +%Y%m%d_%H%M%S)"
        
        # Check if page has embedded sidebar (look for <aside class="sidebar">)
        if grep -q '<aside class="sidebar"' "$page"; then
            echo "  ⚠️  Has embedded sidebar - needs manual rebuild"
        else
            echo "  ✅ No embedded sidebar found"
        fi
        
        # Check if using old sirsimaster-ui
        if grep -q 'sirsimaster-ui.css' "$page"; then
            echo "  ⚠️  Uses old sirsimaster-ui - needs cleanup"
        fi
        
        # Check line count
        lines=$(wc -l < "$page")
        echo "  📊 Lines: $lines"
        
        echo ""
    else
        echo "⚠️  $page not found"
        echo ""
    fi
done

echo "✅ Batch analysis complete!"
echo ""
echo "Pages needing rebuild: $(grep -l '<aside class="sidebar"' *.html 2>/dev/null | wc -l)"
echo "Total pages analyzed: ${#PAGES[@]}"
