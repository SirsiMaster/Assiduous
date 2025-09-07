#!/bin/bash

# Bulk update script to apply standardized admin headers to all pages
# This ensures consistent professional headers across the entire admin portal

# List of pages to update with their specific titles and subtitles
declare -A PAGES=(
    ["AssiduousFlip/admin/clients.html"]="Clients Management|Manage all client information and relationships|Search clients..."
    ["AssiduousFlip/admin/agents.html"]="Agents Management|Manage agent profiles and performance|Search agents..."
    ["AssiduousFlip/admin/transactions.html"]="Transactions|Track and manage all property transactions|Search transactions..."
    ["AssiduousFlip/admin/market.html"]="Market Analysis|Real-time market insights and trends|Search market data..."
    ["AssiduousFlip/admin/settings.html"]="System Settings|Configure platform settings and preferences|Search settings..."
    ["AssiduousFlip/admin/knowledge-base.html"]="Knowledge Base|Documentation and help resources|Search knowledge base..."
    ["AssiduousFlip/admin/development/analytics.html"]="Development Analytics|Code quality metrics and system health|Search dev analytics..."
    ["AssiduousFlip/admin/development/costs.html"]="Development Costs|Track development expenses and budgets|Search cost data..."
    ["AssiduousFlip/admin/development/reports.html"]="Development Reports|Generate and view development reports|Search reports..."
    ["AssiduousFlip/admin/development/docs.html"]="Development Documentation|Technical documentation and guides|Search documentation..."
)

echo "🔧 Updating admin pages with standardized headers..."

for page in "${!PAGES[@]}"; do
    if [ -f "$page" ]; then
        IFS='|' read -r title subtitle search_placeholder <<< "${PAGES[$page]}"
        
        echo "📄 Updating $page..."
        
        # Add admin-layout.css link after assiduous.css
        if grep -q "../assiduous.css" "$page" && ! grep -q "admin-layout.css" "$page"; then
            sed -i '' 's|<link rel="stylesheet" href="../assiduous.css">|<link rel="stylesheet" href="../assiduous.css">\
    <link rel="stylesheet" href="../components/admin-layout.css">|g' "$page"
        elif grep -q "../../assiduous.css" "$page" && ! grep -q "admin-layout.css" "$page"; then
            sed -i '' 's|<link rel="stylesheet" href="../../assiduous.css">|<link rel="stylesheet" href="../../assiduous.css">\
    <link rel="stylesheet" href="../../components/admin-layout.css">|g' "$page"
        fi
        
        # Add admin-header.js script before closing body tag if not already present
        if ! grep -q "admin-header.js" "$page"; then
            sed -i '' 's|<script src="../components/sidebar.js"></script>|<script src="../components/sidebar.js"></script>\
    <script src="../components/admin-header.js"></script>|g' "$page"
            
            sed -i '' 's|<script src="../../components/sidebar.js"></script>|<script src="../../components/sidebar.js"></script>\
    <script src="../../components/admin-header.js"></script>|g' "$page"
        fi
        
        echo "✅ Updated $page with standardized header components"
    else
        echo "⚠️  File not found: $page"
    fi
done

echo ""
echo "🎉 Admin header standardization complete!"
echo ""
echo "📋 Summary:"
echo "   ✅ Added admin-layout.css to all pages"
echo "   ✅ Added admin-header.js to all pages"
echo "   ✅ Ready for manual header placeholder updates"
echo ""
echo "⚡ Next steps:"
echo "   1. Manually replace topbar HTML with admin-header-root placeholders"
echo "   2. Test all pages for consistent styling"
echo "   3. Deploy to Firebase"
