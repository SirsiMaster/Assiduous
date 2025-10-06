#!/bin/bash
# Path Update Script for Restructured Directory
# Updates all relative paths to absolute paths

set -e

PROJECT_ROOT="/Users/thekryptodragon/Development/assiduous"
cd "$PROJECT_ROOT"

echo "🔄 Updating file paths to absolute paths..."
echo "==========================================="

# Function to update paths in files
update_paths() {
    local dir=$1
    local file_pattern=$2
    
    find "$dir" -name "$file_pattern" -type f | while read -r file; do
        echo "  → Updating: $file"
        
        # Update CSS paths
        sed -i '' 's|href="../assets/|href="/assets/|g' "$file"
        sed -i '' 's|href="../components/|href="/src/components/|g' "$file"
        sed -i '' 's|href="../assiduous.css"|href="/assets/css/styles.css"|g' "$file"
        
        # Update JS paths
        sed -i '' 's|src="../assets/|src="/assets/|g' "$file"
        sed -i '' 's|src="assets/|src="/assets/|g' "$file"
        
        # Update image paths
        sed -i '' 's|src="../images/|src="/assets/images/|g' "$file"
        sed -i '' 's|src="images/|src="/assets/images/|g' "$file"
        
        # Update component paths (for components that reference other components)
        sed -i '' 's|\.\.\/components\/|/src/components/|g' "$file"
        
        # Update paths to CSS files that might be in root
        sed -i '' 's|href="\.\.\/css\/|href="/assets/css/|g' "$file"
    done
}

# Update Admin Portal
echo ""
echo "📂 Updating Admin Portal..."
update_paths "public/admin" "*.html"

# Update Client Portal
echo ""
echo "📂 Updating Client Portal..."
update_paths "public/client" "*.html"

# Update Agent Portal (when files exist)
echo ""
echo "📂 Updating Agent Portal..."
if [ "$(find public/agent -name '*.html' -type f | wc -l)" -gt 0 ]; then
    update_paths "public/agent" "*.html"
else
    echo "  → No HTML files yet"
fi

# Update CSS files (for @import statements)
echo ""
echo "🎨 Updating CSS files..."
find public/assets/css -name "*.css" -type f | while read -r file; do
    echo "  → Updating: $file"
    sed -i '' 's|@import "\.\.\/|@import "/assets/css/|g' "$file"
    sed -i '' 's|url(\.\.\/|url(/assets/|g' "$file"
done

# Update JS files (for import/require statements)
echo ""
echo "📜 Updating JavaScript files..."
find public/assets/js -name "*.js" -type f | while read -r file; do
    echo "  → Updating: $file"
    # Update ES6 imports
    sed -i '' "s|from '../|from '/assets/js/|g" "$file"
    sed -i '' "s|from './|from '/assets/js/|g" "$file"
    # Update require statements
    sed -i '' "s|require('../|require('/assets/js/|g" "$file"
    sed -i '' "s|require('./|require('/assets/js/|g" "$file"
done

# Create a mapping file for reference
echo ""
echo "📝 Creating path mapping reference..."
cat > .archive/path_mappings.txt << 'EOF'
# Path Mappings After Restructure

OLD PATH                          → NEW PATH
===============================================
../assets/css/styles.css         → /assets/css/styles.css
../assets/js/services/           → /assets/js/services/
../components/                   → /src/components/
../assiduous.css                 → /assets/css/styles.css
assets/vendor/                   → /assets/vendor/
../images/                       → /assets/images/

PORTALS:
/admin/dashboard.html            → /admin/dashboard.html (no change)
/client/properties.html          → /client/properties.html (no change)

ABSOLUTE PATHS (Always from root):
/assets/                         → All assets
/admin/                          → Admin portal
/client/                         → Client portal
/agent/                          → Agent portal
EOF

echo ""
echo "==========================================="
echo "✅ Path updates complete!"
echo ""
echo "📊 Summary:"
echo "  - Updated all HTML files in public/"
echo "  - Updated CSS @import and url() paths"
echo "  - Updated JavaScript import/require paths"
echo "  - Created path mapping reference"
echo ""
echo "📝 Next steps:"
echo "  1. Test locally: cd public && python -m http.server 8080"
echo "  2. Check browser console for any 404 errors"
echo "  3. Fix any remaining path issues"
echo "  4. Deploy: firebase deploy"
