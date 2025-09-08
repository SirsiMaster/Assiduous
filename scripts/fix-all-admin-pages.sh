#!/bin/bash

# Comprehensive fix for ALL admin pages including development and contracts subdirectories

set -e

echo "Fixing ALL admin pages comprehensively..."

ROOT_DIR="/Users/thekryptodragon/development/assiduous"

# Function to fix any HTML file based on its depth from root
fix_html_by_depth() {
    local file="$1"
    local depth="$2"
    
    echo "  Fixing ($depth levels deep): $(basename $file)"
    
    # Build the relative path based on depth
    local prefix=""
    for ((i=0; i<depth; i++)); do
        prefix="../$prefix"
    done
    
    # Fix CSS paths
    perl -pi -e "s|href=\"[^\"]*assiduous\\.css\"|href=\"${prefix}assiduous.css\"|g" "$file"
    perl -pi -e "s|href=\"[^\"]*components/admin-layout\\.css\"|href=\"${prefix}components/admin-layout.css\"|g" "$file"
    perl -pi -e "s|href=\"[^\"]*components/universal-layout\\.css\"|href=\"${prefix}components/universal-layout.css\"|g" "$file"
    
    # Fix JavaScript component paths
    perl -pi -e "s|src=\"[^\"]*components/sidebar\\.js\"|src=\"${prefix}components/sidebar.js\"|g" "$file"
    perl -pi -e "s|src=\"[^\"]*components/admin-header\\.js\"|src=\"${prefix}components/admin-header.js\"|g" "$file"
    perl -pi -e "s|src=\"[^\"]*components/universal-header\\.js\"|src=\"${prefix}components/universal-header.js\"|g" "$file"
    
    # Fix asset paths
    perl -pi -e "s|src=\"[^\"]*assets/js/services/|src=\"${prefix}assets/js/services/|g" "$file"
    perl -pi -e "s|src=\"[^\"]*assets/js/main\\.js\"|src=\"${prefix}assets/js/main.js\"|g" "$file"
    perl -pi -e "s|src=\"[^\"]*assets/js/|src=\"${prefix}assets/js/|g" "$file"
    
    # Fix image paths if any
    perl -pi -e "s|src=\"[^\"]*assets/images/|src=\"${prefix}assets/images/|g" "$file"
    
    # Remove any remaining /AssiduousFlip/ references
    perl -pi -e 's|/AssiduousFlip/|/|g' "$file"
    perl -pi -e 's|AssiduousFlip/||g' "$file"
}

# Process all directories
for base_dir in "$ROOT_DIR/assiduous-build" "$ROOT_DIR/firebase-migration-package/assiduous-build" "$ROOT_DIR"; do
    if [ ! -d "$base_dir" ]; then
        continue
    fi
    
    echo ""
    echo "Processing: $base_dir"
    
    # Admin root level (1 level deep)
    if [ -d "$base_dir/admin" ]; then
        echo "  Fixing admin root pages..."
        find "$base_dir/admin" -maxdepth 1 -name "*.html" -type f | while read -r file; do
            fix_html_by_depth "$file" 1
        done
    fi
    
    # Admin/development (2 levels deep)
    if [ -d "$base_dir/admin/development" ]; then
        echo "  Fixing admin/development pages..."
        find "$base_dir/admin/development" -maxdepth 1 -name "*.html" -type f | while read -r file; do
            fix_html_by_depth "$file" 2
        done
    fi
    
    # Admin/development/backups (3 levels deep)
    if [ -d "$base_dir/admin/development/backups" ]; then
        echo "  Fixing admin/development/backups pages..."
        find "$base_dir/admin/development/backups" -name "*.html" -type f | while read -r file; do
            fix_html_by_depth "$file" 3
        done
    fi
    
    # Admin/contracts (2 levels deep)
    if [ -d "$base_dir/admin/contracts" ]; then
        echo "  Fixing admin/contracts pages..."
        find "$base_dir/admin/contracts" -name "*.html" -type f | while read -r file; do
            fix_html_by_depth "$file" 2
        done
    fi
    
    # Client portal (1 level deep)
    if [ -d "$base_dir/client" ]; then
        echo "  Fixing client pages..."
        find "$base_dir/client" -name "*.html" -type f | while read -r file; do
            fix_html_by_depth "$file" 1
        done
    fi
    
    # Docs (1 level deep)
    if [ -d "$base_dir/docs" ]; then
        echo "  Fixing docs pages..."
        find "$base_dir/docs" -name "*.html" -type f | while read -r file; do
            fix_html_by_depth "$file" 1
        done
    fi
    
    # Buyers (1 level deep)
    if [ -d "$base_dir/buyers" ]; then
        echo "  Fixing buyers pages..."
        find "$base_dir/buyers" -name "*.html" -type f | while read -r file; do
            fix_html_by_depth "$file" 1
        done
    fi
    
    # Root level HTML files (0 levels deep - same directory)
    echo "  Fixing root level pages..."
    find "$base_dir" -maxdepth 1 -name "*.html" -type f | while read -r file; do
        echo "    Fixing root: $(basename $file)"
        # Root level files use direct references
        perl -pi -e 's|href="[^"]*assiduous\.css"|href="assiduous.css"|g' "$file"
        perl -pi -e 's|href="[^"]*components/|href="components/|g' "$file"
        perl -pi -e 's|src="[^"]*assets/js/|src="assets/js/|g' "$file"
        perl -pi -e 's|src="[^"]*components/|src="components/|g' "$file"
        perl -pi -e 's|/AssiduousFlip/|/|g' "$file"
    done
done

# Special fix for the sidebar and header components themselves
echo ""
echo "Fixing component templates..."
for base_dir in "$ROOT_DIR/assiduous-build" "$ROOT_DIR/firebase-migration-package/assiduous-build" "$ROOT_DIR"; do
    if [ -d "$base_dir/components" ]; then
        # Fix sidebar.html
        if [ -f "$base_dir/components/sidebar.html" ]; then
            echo "  Fixing sidebar.html in $base_dir"
            perl -pi -e 's|\[\[BASE\]\]/admin/|../admin/|g' "$base_dir/components/sidebar.html"
            perl -pi -e 's|\[\[BASE\]\]/|../|g' "$base_dir/components/sidebar.html"
        fi
        
        # Fix admin-header.html if it exists
        if [ -f "$base_dir/components/admin-header.html" ]; then
            echo "  Fixing admin-header.html in $base_dir"
            perl -pi -e 's|\[\[BASE\]\]/|../|g' "$base_dir/components/admin-header.html"
        fi
    fi
done

echo ""
echo "✅ ALL admin pages have been fixed!"
echo ""
echo "Summary of fixes:"
echo "- Admin root pages: ../assiduous.css, ../components/, ../assets/"
echo "- Development pages: ../../assiduous.css, ../../components/, ../../assets/"
echo "- Development backups: ../../../assiduous.css, ../../../components/, ../../../assets/"
echo "- Contracts pages: ../../assiduous.css, ../../components/, ../../assets/"
echo "- Client/Docs/Buyers: ../assiduous.css, ../components/, ../assets/"
echo "- Root pages: assiduous.css, components/, assets/"
echo ""
echo "Next steps:"
echo "1. Hard refresh browser (Cmd+Shift+R)"
echo "2. Test pages:"
echo "   - http://localhost:8080/admin/dashboard.html"
echo "   - http://localhost:8080/admin/development/dashboard.html"
echo "   - http://localhost:8080/admin/contracts/index.html"
echo "3. Deploy: firebase deploy --only hosting"
