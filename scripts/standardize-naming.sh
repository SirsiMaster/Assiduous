#!/bin/bash

# Script to standardize all naming conventions to assiduousflip.web.app
# This script will update all references across the codebase

set -e

echo "Starting comprehensive naming standardization to assiduousflip.web.app..."

# Define the root directory
ROOT_DIR="/Users/thekryptodragon/development/assiduous"

# Function to process replacements in a file
process_replacements() {
    local file="$1"
    
    # URL replacements
    perl -pi -e 's|https://assiduousflip\.web\.app/AssiduousFlip/|https://assiduousflip.web.app/|g' "$file"
    perl -pi -e 's|http://localhost:8080/AssiduousFlip/|http://localhost:8080/|g' "$file"
    perl -pi -e 's|/AssiduousFlip/|/|g' "$file"
    perl -pi -e 's|/Assiduous/AssiduousProperties/|/|g' "$file"
    perl -pi -e 's|/Assiduous/AssiduousRealty/|/|g' "$file"
    perl -pi -e 's|AssiduousProperties|AssiduousFlip|g' "$file"
    perl -pi -e 's|AssiduousRealty|AssiduousFlip|g' "$file"
    perl -pi -e 's|Assiduous Properties|Assiduous Flip|g' "$file"
    perl -pi -e 's|Assiduous Realty|Assiduous Flip|g' "$file"
    
    # Component path replacements
    perl -pi -e 's|\[\[BASE\]\]/AssiduousFlip/|[[BASE]]/|g' "$file"
    perl -pi -e 's|\.\./AssiduousFlip/|../|g' "$file"
    perl -pi -e 's|\./AssiduousFlip/|./|g' "$file"
}

# Function to update files
update_files() {
    local pattern="$1"
    echo "Updating files matching pattern: $pattern"
    
    # Find all matching files (excluding .git, node_modules, and binary files)
    find "$ROOT_DIR" -type f -name "$pattern" \
        -not -path "*/\.git/*" \
        -not -path "*/node_modules/*" \
        -not -path "*/.firebase/*" \
        -not -path "*/package-lock.json" \
        -not -name "*.png" \
        -not -name "*.jpg" \
        -not -name "*.jpeg" \
        -not -name "*.gif" \
        -not -name "*.ico" \
        -not -name "*.woff*" \
        -not -name "*.ttf" \
        -not -name "*.eot" \
        -not -name "*.svg" \
        -print0 | while IFS= read -r -d '' file; do
        
        echo "  Processing: $file"
        
        # Create backup
        cp "$file" "$file.bak"
        
        # Apply all replacements using the function
        process_replacements "$file"
        
        # Check if file changed
        if cmp -s "$file" "$file.bak"; then
            # No changes, remove backup
            rm "$file.bak"
        else
            echo "    ✓ Updated"
            rm "$file.bak"
        fi
    done
}

# Update HTML files
echo "1. Updating HTML files..."
update_files "*.html"

# Update JavaScript files
echo "2. Updating JavaScript files..."
update_files "*.js"
update_files "*.jsx"
update_files "*.ts"
update_files "*.tsx"

# Update CSS files
echo "3. Updating CSS files..."
update_files "*.css"
update_files "*.scss"
update_files "*.sass"

# Update Markdown files
echo "4. Updating Markdown documentation..."
update_files "*.md"

# Update JSON files
echo "5. Updating JSON configuration files..."
update_files "*.json"

# Update shell scripts
echo "6. Updating shell scripts..."
update_files "*.sh"

# Update YAML files
echo "7. Updating YAML files..."
update_files "*.yml"
update_files "*.yaml"

# Special handling for firebase-specific replacements
echo "8. Updating Firebase-specific configurations..."
# Update assiduous-prod references to keep them as is (they're correct)
find "$ROOT_DIR" -name ".firebaserc" -o -name "firebase.json" | while read -r file; do
    echo "  Checking Firebase config: $file"
done

# Update the main index.html redirect
echo "9. Fixing main index.html redirect..."
if [ -f "$ROOT_DIR/index.html" ]; then
    perl -pi -e 's|window\.location\.href = "./AssiduousFlip/"|window.location.href = "./"|g' "$ROOT_DIR/index.html"
    echo "  ✓ Updated main index redirect"
fi

if [ -f "$ROOT_DIR/assiduous-build/index.html" ]; then
    perl -pi -e 's|window\.location\.href = "./AssiduousFlip/"|window.location.href = "./"|g' "$ROOT_DIR/assiduous-build/index.html"
    echo "  ✓ Updated assiduous-build index redirect"
fi

if [ -f "$ROOT_DIR/firebase-migration-package/assiduous-build/index.html" ]; then
    perl -pi -e 's|window\.location\.href = "./AssiduousFlip/"|window.location.href = "./"|g' "$ROOT_DIR/firebase-migration-package/assiduous-build/index.html"
    echo "  ✓ Updated firebase package index redirect"
fi

echo ""
echo "✅ Naming standardization complete!"
echo ""
echo "Next steps:"
echo "1. The AssiduousFlip directories need to be renamed/moved"
echo "2. Run: ./scripts/reorganize-directories.sh"
echo "3. Test locally: python -m http.server 8080"
echo "4. Deploy to Firebase: firebase deploy --only hosting"
