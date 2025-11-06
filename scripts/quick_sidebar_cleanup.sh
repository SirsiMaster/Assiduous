#!/bin/bash

# Quick sidebar cleanup for admin pages
# Removes lines 388-619 (embedded sidebar) and replaces with component reference

cd /Users/thekryptodragon/Development/assiduous/public/admin

for page in agents.html clients.html transactions.html; do
    echo "📄 Processing $page..."
    
    # Get data-active value
    if [[ "$page" == "agents.html" ]]; then
        active="agents"
    elif [[ "$page" == "clients.html" ]]; then
        active="clients"
    elif [[ "$page" == "transactions.html" ]]; then
        active="transactions"
    fi
    
    # Create temp file
    temp_file="${page}.temp"
    
    # Process file: keep lines 1-387, skip 388-619, add component ref, keep rest
    {
        # Lines 1-387
        head -n 387 "$page"
        
        # Add component reference
        echo "        <!-- Sidebar Component -->"
        echo "        <div id=\"sidebar-root\" data-active=\"$active\"></div>"
        echo ""
        echo "        <!-- Main Content -->"
        
        # Lines 620 onwards (adjusted for removed section)
        tail -n +620 "$page" | sed 's/universal-header/header/g'
    } > "$temp_file"
    
    # Replace original
    mv "$temp_file" "$page"
    
    echo "  ✅ Done - $(wc -l < "$page") lines"
    echo ""
done

echo "✅ Batch cleanup complete!"
