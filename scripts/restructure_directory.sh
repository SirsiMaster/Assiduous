#!/bin/bash
# Assiduous Directory Restructure Script
# Date: January 6, 2025
# Purpose: Reorganize project into industry-standard structure

set -e  # Exit on error

PROJECT_ROOT="/Users/thekryptodragon/Development/assiduous"
cd "$PROJECT_ROOT"

echo "🚀 Starting Assiduous Directory Restructure"
echo "============================================"

# Create backup
BACKUP_DIR=".archive/pre-restructure-$(date +%Y%m%d_%H%M%S)"
echo "📦 Creating backup at: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Phase 1: Create New Structure
echo ""
echo "📁 Phase 1: Creating new directory structure..."
mkdir -p public/{admin,client,agent}/
mkdir -p public/assets/{css,js/{services,components,utils},images/{properties,avatars},vendor}
mkdir -p src/{components,templates}
mkdir -p .archive/{old-html-files,backups}

echo "✅ Phase 1 complete"

# Phase 2: Move Portal Files
echo ""
echo "📂 Phase 2: Moving portal files..."

# Admin Portal
if [ -d "admin" ]; then
    echo "  → Copying admin/ to public/admin/"
    cp -r admin/* public/admin/
fi

# Client Portal  
if [ -d "client" ]; then
    echo "  → Copying client/ to public/client/"
    cp -r client/* public/client/
fi

# Agent Portal (empty, but create placeholder)
echo "  → Creating public/agent/ structure"
touch public/agent/.gitkeep

echo "✅ Phase 2 complete"

# Phase 3: Move Assets
echo ""
echo "🎨 Phase 3: Consolidating assets..."

# Move CSS
if [ -d "assets/css" ]; then
    echo "  → Moving CSS files"
    cp -r assets/css/* public/assets/css/
fi

if [ -d "css" ]; then
    echo "  → Merging additional CSS"
    cp -r css/* public/assets/css/ 2>/dev/null || true
fi

# Move JS
if [ -d "assets/js" ]; then
    echo "  → Moving JavaScript files"
    cp -r assets/js/* public/assets/js/
fi

# Move vendor libraries
if [ -d "assets/vendor" ]; then
    echo "  → Moving vendor libraries"
    cp -r assets/vendor/* public/assets/vendor/
fi

# Move images (if they exist)
if [ -d "assets/images" ]; then
    echo "  → Moving images"
    cp -r assets/images/* public/assets/images/
fi

echo "✅ Phase 3 complete"

# Phase 4: Move Components to src/
echo ""
echo "🔧 Phase 4: Organizing source components..."

if [ -d "components" ]; then
    echo "  → Moving components/ to src/components/"
    cp -r components/* src/components/
fi

if [ -d "assiduousflip/components" ]; then
    echo "  → Merging assiduousflip/components/"
    cp -r assiduousflip/components/* src/components/
fi

echo "✅ Phase 4 complete"

# Phase 5: Move Root HTML Files to Archive
echo ""
echo "🗄️  Phase 5: Archiving legacy files..."

# Archive old HTML files at root
for file in index.html index-*.html *-backup.html property-*.html knowledge-base*.html reports*.html demo-*.html test*.html diagnostic.html; do
    if [ -f "$file" ]; then
        echo "  → Archiving $file"
        mv "$file" ".archive/old-html-files/" 2>/dev/null || true
    fi
done

# Archive old CSS at root
if [ -f "assiduous.css" ]; then
    echo "  → Archiving assiduous.css"
    mv assiduous.css .archive/old-html-files/
fi

# Archive backup directories
if [ -d ".backups" ]; then
    echo "  → Archiving .backups/"
    mv .backups/* .archive/backups/ 2>/dev/null || true
    rmdir .backups 2>/dev/null || true
fi

# Archive old UI directories
for dir in sirsi-ui sirsimaster-ui; do
    if [ -d "$dir" ]; then
        echo "  → Archiving $dir/"
        mv "$dir" .archive/
    fi
done

echo "✅ Phase 5 complete"

# Phase 6: Create Index Redirects
echo ""
echo "🔗 Phase 6: Creating index redirects..."

# Admin index redirect
cat > public/admin/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="refresh" content="0; url=dashboard.html">
    <script>window.location.href = 'dashboard.html';</script>
</head>
<body>Redirecting to dashboard...</body>
</html>
EOF

# Client index redirect
cat > public/client/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="refresh" content="0; url=dashboard.html">
    <script>window.location.href = 'dashboard.html';</script>
</head>
<body>Redirecting to dashboard...</body>
</html>
EOF

# Agent index redirect
cat > public/agent/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="refresh" content="0; url=dashboard.html">
    <script>window.location.href = 'dashboard.html';</script>
</head>
<body>Redirecting to dashboard...</body>
</html>
EOF

echo "✅ Phase 6 complete"

# Phase 7: Create Main Landing Page
echo ""
echo "🏠 Phase 7: Creating main landing page..."

cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Assiduous - Real Estate Micro-Flipping Platform</title>
    <link rel="stylesheet" href="/assets/css/styles.css">
</head>
<body>
    <div class="landing-page">
        <h1>Welcome to Assiduous</h1>
        <p>Real Estate Micro-Flipping Platform</p>
        <div class="portal-links">
            <a href="/admin/" class="portal-link">Admin Portal</a>
            <a href="/client/" class="portal-link">Client Portal</a>
            <a href="/agent/" class="portal-link">Agent Portal</a>
        </div>
    </div>
</body>
</html>
EOF

echo "✅ Phase 7 complete"

# Summary
echo ""
echo "============================================"
echo "✅ Directory restructure complete!"
echo ""
echo "📊 Summary:"
echo "  - Created public/ directory structure"
echo "  - Moved all portal files"
echo "  - Consolidated assets"
echo "  - Archived legacy files"
echo "  - Created index redirects"
echo ""
echo "📝 Next steps:"
echo "  1. Update firebase.json to point to 'public'"
echo "  2. Update path references in HTML/CSS/JS files"
echo "  3. Test locally with: python -m http.server 8080"
echo "  4. Deploy to Firebase: firebase deploy"
echo ""
echo "⚠️  IMPORTANT: Review changes before committing!"
echo "   Backup created at: $BACKUP_DIR"
