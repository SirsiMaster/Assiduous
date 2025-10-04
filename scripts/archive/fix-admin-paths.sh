#!/bin/bash

# Script to fix broken paths in admin portal pages
# After moving from /AssiduousFlip/admin/ to /admin/, the relative paths are incorrect

set -e

echo "Fixing broken paths in admin portal pages..."

ROOT_DIR="/Users/thekryptodragon/development/assiduous"

# Function to fix paths in admin HTML files
fix_admin_paths() {
    local dir="$1"
    echo "Processing admin files in: $dir"
    
    # Fix paths in admin/*.html files
    find "$dir/admin" -name "*.html" -type f | while read -r file; do
        echo "  Fixing: $file"
        
        # Fix CSS paths (these files are in root, not parent directory)
        perl -pi -e 's|href="\.\./assiduous\.css"|href="/assiduous.css"|g' "$file"
        perl -pi -e 's|href="\.\./components/admin-layout\.css"|href="/components/admin-layout.css"|g' "$file"
        perl -pi -e 's|href="\.\./components/universal-layout\.css"|href="/components/universal-layout.css"|g' "$file"
        
        # Fix JavaScript paths
        perl -pi -e 's|src="\.\./components/sidebar\.js"|src="/components/sidebar.js"|g' "$file"
        perl -pi -e 's|src="\.\./components/admin-header\.js"|src="/components/admin-header.js"|g' "$file"
        perl -pi -e 's|src="\.\./assets/js/|src="/assets/js/|g' "$file"
        
        # Fix component template paths
        perl -pi -e 's|src="\.\./AssiduousFlip/components/|src="/components/|g' "$file"
        perl -pi -e 's|href="\.\./AssiduousFlip/|href="/|g' "$file"
        
        # Fix any remaining ../AssiduousFlip references
        perl -pi -e 's|\.\./AssiduousFlip/|/|g' "$file"
    done
    
    # Also fix paths in admin/development/*.html files
    if [ -d "$dir/admin/development" ]; then
        find "$dir/admin/development" -name "*.html" -type f | while read -r file; do
            echo "  Fixing: $file"
            
            # These are two levels deep, so need different paths
            perl -pi -e 's|href="\.\./\.\./assiduous\.css"|href="/assiduous.css"|g' "$file"
            perl -pi -e 's|href="\.\./\.\./components/admin-layout\.css"|href="/components/admin-layout.css"|g' "$file"
            perl -pi -e 's|href="\.\./\.\./components/universal-layout\.css"|href="/components/universal-layout.css"|g' "$file"
            
            # Fix JavaScript paths
            perl -pi -e 's|src="\.\./\.\./components/sidebar\.js"|src="/components/sidebar.js"|g' "$file"
            perl -pi -e 's|src="\.\./\.\./components/admin-header\.js"|src="/components/admin-header.js"|g' "$file"
            perl -pi -e 's|src="\.\./\.\./assets/js/|src="/assets/js/|g' "$file"
            
            # Fix any remaining ../../AssiduousFlip references
            perl -pi -e 's|\.\./\.\./AssiduousFlip/|/|g' "$file"
        done
    fi
    
    # Fix paths in admin/contracts/*.html files
    if [ -d "$dir/admin/contracts" ]; then
        find "$dir/admin/contracts" -name "*.html" -type f | while read -r file; do
            echo "  Fixing: $file"
            
            # These are also two levels deep
            perl -pi -e 's|href="\.\./\.\./assiduous\.css"|href="/assiduous.css"|g' "$file"
            perl -pi -e 's|href="\.\./\.\./components/admin-layout\.css"|href="/components/admin-layout.css"|g' "$file"
            perl -pi -e 's|href="\.\./\.\./components/universal-layout\.css"|href="/components/universal-layout.css"|g' "$file"
            
            # Fix JavaScript paths
            perl -pi -e 's|src="\.\./\.\./components/sidebar\.js"|src="/components/sidebar.js"|g' "$file"
            perl -pi -e 's|src="\.\./\.\./components/admin-header\.js"|src="/components/admin-header.js"|g' "$file"
            perl -pi -e 's|src="\.\./\.\./assets/js/|src="/assets/js/|g' "$file"
            
            # Fix any remaining ../../AssiduousFlip references
            perl -pi -e 's|\.\./\.\./AssiduousFlip/|/|g' "$file"
        done
    fi
}

# Fix paths in main directory
echo "1. Fixing paths in main directory..."
if [ -d "$ROOT_DIR/admin" ]; then
    fix_admin_paths "$ROOT_DIR"
fi

# Fix paths in assiduous-build directory (this is what gets deployed)
echo "2. Fixing paths in assiduous-build directory..."
if [ -d "$ROOT_DIR/assiduous-build/admin" ]; then
    fix_admin_paths "$ROOT_DIR/assiduous-build"
fi

# Fix paths in firebase-migration-package
echo "3. Fixing paths in firebase-migration-package..."
if [ -d "$ROOT_DIR/firebase-migration-package/assiduous-build/admin" ]; then
    fix_admin_paths "$ROOT_DIR/firebase-migration-package/assiduous-build"
fi

# Also fix client portal paths
echo "4. Fixing client portal paths..."
for dir in "$ROOT_DIR" "$ROOT_DIR/assiduous-build" "$ROOT_DIR/firebase-migration-package/assiduous-build"; do
    if [ -d "$dir/client" ]; then
        find "$dir/client" -name "*.html" -type f | while read -r file; do
            echo "  Fixing: $file"
            perl -pi -e 's|href="\.\./assiduous\.css"|href="/assiduous.css"|g' "$file"
            perl -pi -e 's|href="\.\./components/|href="/components/|g' "$file"
            perl -pi -e 's|src="\.\./assets/js/|src="/assets/js/|g' "$file"
            perl -pi -e 's|\.\./AssiduousFlip/|/|g' "$file"
        done
    fi
done

# Fix root level HTML files
echo "5. Fixing root level HTML files..."
for dir in "$ROOT_DIR" "$ROOT_DIR/assiduous-build" "$ROOT_DIR/firebase-migration-package/assiduous-build"; do
    find "$dir" -maxdepth 1 -name "*.html" -type f | while read -r file; do
        echo "  Fixing: $file"
        # These are at root level, so paths should be relative without slashes
        perl -pi -e 's|href="/assiduous\.css"|href="assiduous.css"|g' "$file"
        perl -pi -e 's|href="/components/|href="components/|g' "$file"
        perl -pi -e 's|src="/assets/js/|src="assets/js/|g' "$file"
        perl -pi -e 's|/AssiduousFlip/||g' "$file"
    done
done

echo ""
echo "✅ Path fixes complete!"
echo ""
echo "Next steps:"
echo "1. Test locally: python -m http.server 8080"
echo "2. Deploy to Firebase: firebase deploy --only hosting"
