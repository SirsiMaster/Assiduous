#!/bin/bash

# Script to fix broken paths in admin portal pages using relative paths
# After moving from /AssiduousFlip/admin/ to /admin/, the relative paths need adjustment

set -e

echo "Fixing broken paths in admin portal pages with relative paths..."

ROOT_DIR="/Users/thekryptodragon/development/assiduous"

# Function to fix paths in admin HTML files
fix_admin_paths() {
    local dir="$1"
    echo "Processing admin files in: $dir"
    
    # Fix paths in admin/*.html files (one level deep from root)
    find "$dir/admin" -maxdepth 1 -name "*.html" -type f | while read -r file; do
        echo "  Fixing: $file"
        
        # Admin files are one level deep, so need to go up one level
        perl -pi -e 's|href="[^"]*assiduous\.css"|href="../assiduous.css"|g' "$file"
        perl -pi -e 's|href="[^"]*components/admin-layout\.css"|href="../components/admin-layout.css"|g' "$file"
        perl -pi -e 's|href="[^"]*components/universal-layout\.css"|href="../components/universal-layout.css"|g' "$file"
        
        # Fix JavaScript paths
        perl -pi -e 's|src="[^"]*components/sidebar\.js"|src="../components/sidebar.js"|g' "$file"
        perl -pi -e 's|src="[^"]*components/admin-header\.js"|src="../components/admin-header.js"|g' "$file"
        perl -pi -e 's|src="[^"]*assets/js/|src="../assets/js/|g' "$file"
    done
    
    # Fix paths in admin/development/*.html files (two levels deep)
    if [ -d "$dir/admin/development" ]; then
        find "$dir/admin/development" -name "*.html" -type f | while read -r file; do
            echo "  Fixing: $file"
            
            # These are two levels deep, so need ../../
            perl -pi -e 's|href="[^"]*assiduous\.css"|href="../../assiduous.css"|g' "$file"
            perl -pi -e 's|href="[^"]*components/admin-layout\.css"|href="../../components/admin-layout.css"|g' "$file"
            perl -pi -e 's|href="[^"]*components/universal-layout\.css"|href="../../components/universal-layout.css"|g' "$file"
            
            # Fix JavaScript paths
            perl -pi -e 's|src="[^"]*components/sidebar\.js"|src="../../components/sidebar.js"|g' "$file"
            perl -pi -e 's|src="[^"]*components/admin-header\.js"|src="../../components/admin-header.js"|g' "$file"
            perl -pi -e 's|src="[^"]*assets/js/|src="../../assets/js/|g' "$file"
        done
        
        # Fix paths in admin/development/backups/*.html files (three levels deep)
        if [ -d "$dir/admin/development/backups" ]; then
            find "$dir/admin/development/backups" -name "*.html" -type f | while read -r file; do
                echo "  Fixing: $file"
                
                # These are three levels deep, so need ../../../
                perl -pi -e 's|href="[^"]*assiduous\.css"|href="../../../assiduous.css"|g' "$file"
                perl -pi -e 's|href="[^"]*components/admin-layout\.css"|href="../../../components/admin-layout.css"|g' "$file"
                perl -pi -e 's|href="[^"]*components/universal-layout\.css"|href="../../../components/universal-layout.css"|g' "$file"
                
                # Fix JavaScript paths
                perl -pi -e 's|src="[^"]*components/sidebar\.js"|src="../../../components/sidebar.js"|g' "$file"
                perl -pi -e 's|src="[^"]*components/admin-header\.js"|src="../../../components/admin-header.js"|g' "$file"
                perl -pi -e 's|src="[^"]*assets/js/|src="../../../assets/js/|g' "$file"
            done
        fi
    fi
    
    # Fix paths in admin/contracts/*.html files (two levels deep)
    if [ -d "$dir/admin/contracts" ]; then
        find "$dir/admin/contracts" -name "*.html" -type f | while read -r file; do
            echo "  Fixing: $file"
            
            # These are two levels deep
            perl -pi -e 's|href="[^"]*assiduous\.css"|href="../../assiduous.css"|g' "$file"
            perl -pi -e 's|href="[^"]*components/admin-layout\.css"|href="../../components/admin-layout.css"|g' "$file"
            perl -pi -e 's|href="[^"]*components/universal-layout\.css"|href="../../components/universal-layout.css"|g' "$file"
            
            # Fix JavaScript paths
            perl -pi -e 's|src="[^"]*components/sidebar\.js"|src="../../components/sidebar.js"|g' "$file"
            perl -pi -e 's|src="[^"]*components/admin-header\.js"|src="../../components/admin-header.js"|g' "$file"
            perl -pi -e 's|src="[^"]*assets/js/|src="../../assets/js/|g' "$file"
        done
    fi
}

# Fix paths in client portal
fix_client_paths() {
    local dir="$1"
    if [ -d "$dir/client" ]; then
        find "$dir/client" -name "*.html" -type f | while read -r file; do
            echo "  Fixing client: $file"
            # Client is one level deep
            perl -pi -e 's|href="[^"]*assiduous\.css"|href="../assiduous.css"|g' "$file"
            perl -pi -e 's|href="[^"]*components/|href="../components/|g' "$file"
            perl -pi -e 's|src="[^"]*assets/js/|src="../assets/js/|g' "$file"
        done
    fi
}

# Fix paths in docs
fix_docs_paths() {
    local dir="$1"
    if [ -d "$dir/docs" ]; then
        find "$dir/docs" -name "*.html" -type f | while read -r file; do
            echo "  Fixing docs: $file"
            # Docs is one level deep
            perl -pi -e 's|href="[^"]*assiduous\.css"|href="../assiduous.css"|g' "$file"
            perl -pi -e 's|href="[^"]*components/|href="../components/|g' "$file"
            perl -pi -e 's|src="[^"]*assets/js/|src="../assets/js/|g' "$file"
        done
    fi
}

# Fix paths in components
fix_component_paths() {
    local dir="$1"
    if [ -d "$dir/components" ]; then
        find "$dir/components" -name "*.html" -type f | while read -r file; do
            echo "  Fixing component: $file"
            # Components is one level deep
            perl -pi -e 's|href="[^"]*assiduous\.css"|href="../assiduous.css"|g' "$file"
            perl -pi -e 's|href="[^"]*components/|href="./|g' "$file"
            perl -pi -e 's|src="[^"]*assets/js/|src="../assets/js/|g' "$file"
        done
    fi
}

# Process all directories
for base_dir in "$ROOT_DIR" "$ROOT_DIR/assiduous-build" "$ROOT_DIR/firebase-migration-package/assiduous-build"; do
    if [ -d "$base_dir" ]; then
        echo ""
        echo "Processing base directory: $base_dir"
        fix_admin_paths "$base_dir"
        fix_client_paths "$base_dir"
        fix_docs_paths "$base_dir"
        fix_component_paths "$base_dir"
    fi
done

echo ""
echo "✅ Path fixes complete with relative paths!"
echo ""
echo "Next steps:"
echo "1. Test locally: cd assiduous-build && python -m http.server 8080"
echo "2. Open: http://localhost:8080/admin/dashboard.html"
echo "3. Deploy to Firebase: firebase deploy --only hosting"
