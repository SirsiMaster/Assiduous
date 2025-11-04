#!/bin/bash
cd "$(dirname "$0")/../public/agent" || exit 1

for htmlfile in *.html; do
    template="${htmlfile%.html}.template.html"
    [ -f "$template" ] && continue
    
    cp "$htmlfile" "$template"
    sed -i '' 's|href="\.\./|href="{{BASE_PATH}}|g' "$template"
    sed -i '' 's|src="\.\./|src="{{BASE_PATH}}|g' "$template"
    
    pagename="${htmlfile%.html}"
    sed -i '' "/<body/a\\
<!-- @component:sidebar active=\"$pagename\" role=\"agent\" -->
" "$template"
    
    echo "✓ Created $template"
done

echo "Done! Run 'npm run ucs:build' to generate pages."
