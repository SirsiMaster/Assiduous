#!/bin/bash

# Fix sidebar component paths after directory reorganization

set -e

echo "Fixing sidebar component paths..."

ROOT_DIR="/Users/thekryptodragon/development/assiduous"

# Fix sidebar.html files to use relative paths instead of [[BASE]] tokens
fix_sidebar_html() {
    local file="$1"
    echo "  Fixing sidebar.html: $file"
    
    # Replace all [[BASE]] tokens with relative paths
    # From components directory, admin is one level up
    perl -pi -e 's|\[\[BASE\]\]/admin/|../admin/|g' "$file"
    perl -pi -e 's|\[\[BASE\]\]/|../|g' "$file"
}

# Fix sidebar.js files
fix_sidebar_js() {
    local file="$1"
    echo "  Fixing sidebar.js: $file"
    
    # Update the resolveBase function to return empty string
    perl -pi -e "s|return '/Assiduous/AssiduousFlip';|return '';|g" "$file"
    perl -pi -e "s|return '/AssiduousFlip';|return '';|g" "$file"
    
    # Update the template path
    perl -pi -e "s|base \+ '/components/sidebar.html'|'../components/sidebar.html'|g" "$file"
}

# Process all directories
for base_dir in "$ROOT_DIR" "$ROOT_DIR/assiduous-build" "$ROOT_DIR/firebase-migration-package/assiduous-build"; do
    if [ -f "$base_dir/components/sidebar.html" ]; then
        fix_sidebar_html "$base_dir/components/sidebar.html"
    fi
    
    if [ -f "$base_dir/components/sidebar.js" ]; then
        fix_sidebar_js "$base_dir/components/sidebar.js"
    fi
done

# Also copy the fixed files to main directories
echo "Copying fixed components to main directories..."
if [ -f "$ROOT_DIR/assiduous-build/components/sidebar.html" ]; then
    cp "$ROOT_DIR/assiduous-build/components/sidebar.html" "$ROOT_DIR/components/sidebar.html" 2>/dev/null || true
    cp "$ROOT_DIR/assiduous-build/components/sidebar.js" "$ROOT_DIR/components/sidebar.js" 2>/dev/null || true
fi

echo ""
echo "✅ Sidebar paths fixed!"
echo ""
echo "Next steps:"
echo "1. Refresh your browser (Cmd+Shift+R for hard refresh)"
echo "2. Test locally: http://localhost:8080/admin/dashboard.html"
echo "3. Deploy to Firebase: firebase deploy --only hosting"
