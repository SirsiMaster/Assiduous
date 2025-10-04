#!/bin/bash

# Script to reorganize directories - move AssiduousFlip content to appropriate root locations
# This maintains Firebase hosting structure while eliminating the AssiduousFlip subdirectory

set -e

echo "Starting directory reorganization..."

ROOT_DIR="/Users/thekryptodragon/development/assiduous"

# Function to safely move directory contents
move_contents() {
    local source="$1"
    local dest="$2"
    
    if [ -d "$source" ]; then
        echo "Moving contents from $source to $dest"
        
        # Create destination if it doesn't exist
        mkdir -p "$dest"
        
        # Move all contents (including hidden files)
        shopt -s dotglob
        for item in "$source"/*; do
            if [ -e "$item" ]; then
                basename_item=$(basename "$item")
                
                # Check if destination already exists
                if [ -e "$dest/$basename_item" ]; then
                    echo "  Warning: $dest/$basename_item already exists"
                    
                    # If it's a directory, merge contents
                    if [ -d "$item" ] && [ -d "$dest/$basename_item" ]; then
                        echo "    Merging directory contents..."
                        cp -r "$item"/* "$dest/$basename_item/" 2>/dev/null || true
                        rm -rf "$item"
                    else
                        # Backup existing and replace
                        echo "    Creating backup and replacing..."
                        mv "$dest/$basename_item" "$dest/$basename_item.backup"
                        mv "$item" "$dest/"
                    fi
                else
                    # Simple move
                    mv "$item" "$dest/"
                    echo "  ✓ Moved $basename_item"
                fi
            fi
        done
        shopt -u dotglob
        
        # Remove the now-empty source directory
        if [ -z "$(ls -A "$source")" ]; then
            rmdir "$source"
            echo "  ✓ Removed empty directory: $source"
        fi
    else
        echo "  Source directory not found: $source"
    fi
}

# 1. Move AssiduousFlip contents from main directory
echo "1. Reorganizing main AssiduousFlip directory..."
if [ -d "$ROOT_DIR/AssiduousFlip" ]; then
    # Move admin, client, and other subdirectories to root
    for dir in admin client components docs assets; do
        if [ -d "$ROOT_DIR/AssiduousFlip/$dir" ]; then
            move_contents "$ROOT_DIR/AssiduousFlip/$dir" "$ROOT_DIR/$dir"
        fi
    done
    
    # Move any HTML files in AssiduousFlip to root
    find "$ROOT_DIR/AssiduousFlip" -maxdepth 1 -name "*.html" -exec mv {} "$ROOT_DIR/" \; 2>/dev/null || true
    find "$ROOT_DIR/AssiduousFlip" -maxdepth 1 -name "*.js" -exec mv {} "$ROOT_DIR/" \; 2>/dev/null || true
    find "$ROOT_DIR/AssiduousFlip" -maxdepth 1 -name "*.css" -exec mv {} "$ROOT_DIR/" \; 2>/dev/null || true
    
    # Remove AssiduousFlip directory if empty
    if [ -d "$ROOT_DIR/AssiduousFlip" ] && [ -z "$(ls -A "$ROOT_DIR/AssiduousFlip")" ]; then
        rmdir "$ROOT_DIR/AssiduousFlip"
        echo "  ✓ Removed empty AssiduousFlip directory"
    fi
fi

# 2. Reorganize assiduous-build/AssiduousFlip
echo "2. Reorganizing assiduous-build/AssiduousFlip directory..."
if [ -d "$ROOT_DIR/assiduous-build/AssiduousFlip" ]; then
    for dir in admin client components docs assets; do
        if [ -d "$ROOT_DIR/assiduous-build/AssiduousFlip/$dir" ]; then
            move_contents "$ROOT_DIR/assiduous-build/AssiduousFlip/$dir" "$ROOT_DIR/assiduous-build/$dir"
        fi
    done
    
    # Move any root files
    find "$ROOT_DIR/assiduous-build/AssiduousFlip" -maxdepth 1 -type f -exec mv {} "$ROOT_DIR/assiduous-build/" \; 2>/dev/null || true
    
    # Remove if empty
    if [ -d "$ROOT_DIR/assiduous-build/AssiduousFlip" ] && [ -z "$(ls -A "$ROOT_DIR/assiduous-build/AssiduousFlip")" ]; then
        rmdir "$ROOT_DIR/assiduous-build/AssiduousFlip"
        echo "  ✓ Removed empty assiduous-build/AssiduousFlip directory"
    fi
fi

# 3. Reorganize firebase-migration-package/assiduous-build/AssiduousFlip
echo "3. Reorganizing firebase-migration-package/assiduous-build/AssiduousFlip directory..."
FIREBASE_BUILD="$ROOT_DIR/firebase-migration-package/assiduous-build"
if [ -d "$FIREBASE_BUILD/AssiduousFlip" ]; then
    for dir in admin client components docs assets; do
        if [ -d "$FIREBASE_BUILD/AssiduousFlip/$dir" ]; then
            move_contents "$FIREBASE_BUILD/AssiduousFlip/$dir" "$FIREBASE_BUILD/$dir"
        fi
    done
    
    # Move any root files
    find "$FIREBASE_BUILD/AssiduousFlip" -maxdepth 1 -type f -exec mv {} "$FIREBASE_BUILD/" \; 2>/dev/null || true
    
    # Remove if empty
    if [ -d "$FIREBASE_BUILD/AssiduousFlip" ] && [ -z "$(ls -A "$FIREBASE_BUILD/AssiduousFlip")" ]; then
        rmdir "$FIREBASE_BUILD/AssiduousFlip"
        echo "  ✓ Removed empty firebase AssiduousFlip directory"
    fi
fi

# 4. Update any remaining AssiduousFlip references in paths
echo "4. Cleaning up any remaining path references..."

# Update component loaders
find "$ROOT_DIR" -name "*.js" -o -name "*.html" | while read -r file; do
    if grep -q "AssiduousFlip/" "$file" 2>/dev/null; then
        echo "  Updating paths in: $file"
        perl -pi -e 's|/AssiduousFlip/|/|g' "$file"
        perl -pi -e 's|AssiduousFlip/||g' "$file"
    fi
done

# 5. Create a mapping file for reference
echo "5. Creating directory mapping reference..."
cat > "$ROOT_DIR/DIRECTORY_REORGANIZATION.md" << EOF
# Directory Reorganization Complete

## Changes Made:

### Before:
\`\`\`
/AssiduousFlip/
├── admin/
├── client/
├── components/
├── docs/
└── assets/
\`\`\`

### After:
\`\`\`
/
├── admin/
├── client/
├── components/
├── docs/
└── assets/
\`\`\`

## URL Mapping:

- OLD: https://assiduousflip.web.app/AssiduousFlip/admin/dashboard.html
- NEW: https://assiduousflip.web.app/admin/dashboard.html

- OLD: http://localhost:8080/AssiduousFlip/
- NEW: http://localhost:8080/

## Timestamp: $(date)

## Next Steps:
1. Test locally: python -m http.server 8080
2. Verify all pages load correctly
3. Deploy to Firebase: firebase deploy --only hosting
EOF

echo ""
echo "✅ Directory reorganization complete!"
echo ""
echo "Summary of changes:"
echo "- Moved all AssiduousFlip subdirectory contents to their parent directories"
echo "- Updated path references to remove AssiduousFlip/ prefix"
echo "- Created DIRECTORY_REORGANIZATION.md for reference"
echo ""
echo "Please test the changes locally before deploying to Firebase."
