#!/bin/bash
# Convert client pages to UCS templates

cd "$(dirname "$0")/../public/client" || exit 1

for htmlfile in *.html; do
    # Skip if template already exists or is dashboard
    template="${htmlfile%.html}.template.html"
    [ -f "$template" ] && continue
    [ "$htmlfile" = "dashboard.html" ] && continue
    
    echo "Converting $htmlfile..."
    
    # Copy to template
    cp "$htmlfile" "$template"
    
    # Replace hardcoded paths with tokens
    sed -i '' 's|href="\.\./|href="{{BASE_PATH}}|g' "$template"
    sed -i '' 's|src="\.\./|src="{{BASE_PATH}}|g' "$template"
    
    # Find <body> tag and insert component directive after it
    pagename="${htmlfile%.html}"
    sed -i '' "/<body/a\\
<!-- @component:sidebar active=\"$pagename\" role=\"client\" -->
" "$template"
    
    echo "✓ Created $template"
done

echo ""
echo "Done! Run 'npm run ucs:build' to generate pages."
