#!/bin/bash

# Script to sync all .md files with .html versions for document hub
# This ensures every markdown file has a readable HTML version

echo "🔄 Starting MD to HTML sync for document hub..."

# Function to convert MD to HTML with proper styling
convert_md_to_html() {
    local md_file="$1"
    local html_file="$2"
    local title=$(basename "$md_file" .md | tr '_' ' ')
    
    echo "Converting: $md_file -> $html_file"
    
    cat > "$html_file" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TITLE_PLACEHOLDER - Assiduous Documentation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1, h2, h3, h4, h5, h6 {
            margin-top: 24px;
            margin-bottom: 16px;
            font-weight: 600;
            line-height: 1.25;
        }
        h1 { font-size: 2em; border-bottom: 1px solid #e1e4e8; padding-bottom: 0.3em; }
        h2 { font-size: 1.5em; border-bottom: 1px solid #e1e4e8; padding-bottom: 0.3em; }
        h3 { font-size: 1.25em; }
        code {
            background: #f6f8fa;
            padding: 0.2em 0.4em;
            border-radius: 3px;
            font-size: 85%;
        }
        pre {
            background: #f6f8fa;
            padding: 16px;
            overflow: auto;
            border-radius: 6px;
            line-height: 1.45;
        }
        pre code {
            background: transparent;
            padding: 0;
        }
        ul, ol {
            padding-left: 2em;
            margin-bottom: 16px;
        }
        li {
            margin-bottom: 4px;
        }
        a {
            color: #0366d6;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        blockquote {
            padding: 0 1em;
            color: #6a737d;
            border-left: 0.25em solid #dfe2e5;
            margin: 0 0 16px 0;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 16px;
        }
        table th, table td {
            padding: 6px 13px;
            border: 1px solid #dfe2e5;
        }
        table tr:nth-child(2n) {
            background-color: #f6f8fa;
        }
        .nav-link {
            display: inline-block;
            padding: 8px 16px;
            background: #0366d6;
            color: white;
            border-radius: 6px;
            margin: 10px 5px;
            text-decoration: none;
        }
        .nav-link:hover {
            background: #0256c7;
            text-decoration: none;
        }
        .timestamp {
            color: #6a737d;
            font-size: 0.85em;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e1e4e8;
        }
    </style>
</head>
<body>
    <div class="container">
        <nav>
            <a href="/docs/index.html" class="nav-link">📚 Documentation Hub</a>
            <a href="/docs/readme.html" class="nav-link">📖 README</a>
            <a href="/docs/changelog.html" class="nav-link">📝 Changelog</a>
            <a href="/docs/warp.html" class="nav-link">⚙️ WARP Rules</a>
        </nav>
        <h1>TITLE_PLACEHOLDER</h1>
        <div class="content">
CONTENT_PLACEHOLDER
        </div>
        <div class="timestamp">
            Last updated: DATE_PLACEHOLDER
        </div>
    </div>
</body>
</html>
EOF

    # Replace placeholders
    sed -i "" "s/TITLE_PLACEHOLDER/$title/g" "$html_file"
    
    # Convert markdown to HTML content (basic conversion)
    local content=$(cat "$md_file" | \
        sed 's/&/\&amp;/g' | \
        sed 's/</\&lt;/g' | \
        sed 's/>/\&gt;/g' | \
        sed 's/^### \(.*\)$/<h3>\1<\/h3>/g' | \
        sed 's/^## \(.*\)$/<h2>\1<\/h2>/g' | \
        sed 's/^# \(.*\)$/<h1>\1<\/h1>/g' | \
        sed 's/^\* \(.*\)$/<li>\1<\/li>/g' | \
        sed 's/^\- \(.*\)$/<li>\1<\/li>/g' | \
        sed 's/`\([^`]*\)`/<code>\1<\/code>/g' | \
        sed 's/\*\*\([^*]*\)\*\*/<strong>\1<\/strong>/g' | \
        sed 's/\*\([^*]*\)\*/<em>\1<\/em>/g' | \
        sed 's/^$/<br>/g' | \
        sed 's/^---$/<hr>/g')
    
    # Write content
    echo "$content" > /tmp/content.tmp
    awk '/CONTENT_PLACEHOLDER/{system("cat /tmp/content.tmp");next}1' "$html_file" > "$html_file.tmp"
    mv "$html_file.tmp" "$html_file"
    
    # Add current date
    sed -i "" "s/DATE_PLACEHOLDER/$(date '+%Y-%m-%d %H:%M:%S')/g" "$html_file"
    
    rm -f /tmp/content.tmp
}

# Create docs directory if it doesn't exist
mkdir -p docs

# Sync root .md files to docs/*.html
echo "📁 Processing root markdown files..."
for md in *.md; do
    if [ -f "$md" ]; then
        html_name=$(echo "$md" | tr '[:upper:]' '[:lower:]' | sed 's/.md$/.html/')
        html_path="docs/$html_name"
        convert_md_to_html "$md" "$html_path"
    fi
done

# Sync docs/*.md files to docs/*.html
echo "📁 Processing docs markdown files..."
for md in docs/*.md; do
    if [ -f "$md" ]; then
        html_name=$(echo "$(basename "$md")" | tr '[:upper:]' '[:lower:]' | sed 's/.md$/.html/')
        html_path="docs/$html_name"
        convert_md_to_html "$md" "$html_path"
    fi
done

# Copy to firebase build directory
echo "📦 Copying to Firebase build directory..."
cp -r docs/*.html firebase-migration-package/assiduous-build/docs/ 2>/dev/null || true

# Create index.html for document hub
echo "📚 Creating document hub index..."
cat > docs/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Assiduous Documentation Hub</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
            margin-bottom: 30px;
        }
        .doc-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        .doc-card {
            border: 1px solid #e1e4e8;
            border-radius: 8px;
            padding: 20px;
            transition: all 0.3s;
            text-decoration: none;
            color: #333;
            display: block;
        }
        .doc-card:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateY(-2px);
            border-color: #667eea;
        }
        .doc-card h3 {
            margin-top: 0;
            color: #667eea;
        }
        .doc-card p {
            margin: 10px 0 0 0;
            color: #666;
            font-size: 14px;
        }
        .category {
            margin: 30px 0;
        }
        .category h2 {
            color: #764ba2;
            border-left: 4px solid #667eea;
            padding-left: 10px;
        }
        .status {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            margin-left: 10px;
        }
        .status.active { background: #28a745; color: white; }
        .status.draft { background: #ffc107; color: #333; }
        .status.archived { background: #6c757d; color: white; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📚 Assiduous Documentation Hub</h1>
        <p>Complete documentation for the Assiduous AI-Powered Real Estate Platform</p>
        
        <div class="category">
            <h2>🚀 Getting Started</h2>
            <div class="doc-grid">
                <a href="readme.html" class="doc-card">
                    <h3>README</h3>
                    <p>Project overview, setup instructions, and quick start guide</p>
                </a>
                <a href="warp.html" class="doc-card">
                    <h3>WARP Development Rules</h3>
                    <p>Critical governance rules for development with WARP</p>
                </a>
                <a href="changelog.html" class="doc-card">
                    <h3>Changelog</h3>
                    <p>All notable changes and version history</p>
                </a>
            </div>
        </div>
        
        <div class="category">
            <h2>📋 Project Management</h2>
            <div class="doc-grid">
                <a href="project_scope.html" class="doc-card">
                    <h3>Project Scope</h3>
                    <p>Detailed project boundaries and deliverables</p>
                </a>
                <a href="project_management.html" class="doc-card">
                    <h3>Project Management</h3>
                    <p>Timeline, milestones, and resource planning</p>
                </a>
                <a href="requirements_specification.html" class="doc-card">
                    <h3>Requirements Specification</h3>
                    <p>Complete functional and technical requirements</p>
                </a>
            </div>
        </div>
        
        <div class="category">
            <h2>🏗️ Technical Documentation</h2>
            <div class="doc-grid">
                <a href="architecture_design.html" class="doc-card">
                    <h3>Architecture Design</h3>
                    <p>System architecture and design patterns</p>
                </a>
                <a href="technical_design.html" class="doc-card">
                    <h3>Technical Design</h3>
                    <p>Detailed technical specifications</p>
                </a>
                <a href="api_specification.html" class="doc-card">
                    <h3>API Specification</h3>
                    <p>REST API endpoints and data contracts</p>
                </a>
                <a href="data_model.html" class="doc-card">
                    <h3>Data Model</h3>
                    <p>Database schema and relationships</p>
                </a>
            </div>
        </div>
        
        <div class="category">
            <h2>🔒 Security & Compliance</h2>
            <div class="doc-grid">
                <a href="security_compliance.html" class="doc-card">
                    <h3>Security & Compliance</h3>
                    <p>Security policies and compliance requirements</p>
                </a>
                <a href="test_accounts.html" class="doc-card">
                    <h3>Test Accounts</h3>
                    <p>Test credentials for development and QA</p>
                </a>
            </div>
        </div>
        
        <div class="category">
            <h2>✅ Quality Assurance</h2>
            <div class="doc-grid">
                <a href="test_plan.html" class="doc-card">
                    <h3>Test Plan</h3>
                    <p>Comprehensive testing strategy</p>
                </a>
                <a href="qa_plan.html" class="doc-card">
                    <h3>QA Plan</h3>
                    <p>Quality assurance processes</p>
                </a>
                <a href="test-automation.html" class="doc-card">
                    <h3>Test Automation</h3>
                    <p>Automated testing framework</p>
                </a>
            </div>
        </div>
        
        <div class="category">
            <h2>🚀 Deployment & Operations</h2>
            <div class="doc-grid">
                <a href="deployment_guide.html" class="doc-card">
                    <h3>Deployment Guide</h3>
                    <p>Step-by-step deployment instructions</p>
                </a>
                <a href="maintenance_support.html" class="doc-card">
                    <h3>Maintenance & Support</h3>
                    <p>Ongoing maintenance procedures</p>
                </a>
                <a href="change_management.html" class="doc-card">
                    <h3>Change Management</h3>
                    <p>Change control processes</p>
                </a>
            </div>
        </div>
        
        <div class="category">
            <h2>📚 Additional Resources</h2>
            <div class="doc-grid">
                <a href="training_documentation.html" class="doc-card">
                    <h3>Training Documentation</h3>
                    <p>User and developer training materials</p>
                </a>
                <a href="user_stories.html" class="doc-card">
                    <h3>User Stories</h3>
                    <p>User scenarios and acceptance criteria</p>
                </a>
                <a href="communication_plan.html" class="doc-card">
                    <h3>Communication Plan</h3>
                    <p>Stakeholder communication strategy</p>
                </a>
            </div>
        </div>
        
        <p style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e1e4e8; color: #666; font-size: 14px;">
            Last updated: DATE_PLACEHOLDER | 
            <a href="https://github.com/SirsiMaster/Assiduous">GitHub Repository</a> |
            <a href="https://assiduousflip.web.app">Live Application</a>
        </p>
    </div>
</body>
</html>
EOF

sed -i "" "s/DATE_PLACEHOLDER/$(date '+%Y-%m-%d %H:%M:%S')/g" docs/index.html

# Copy index to firebase build
cp docs/index.html firebase-migration-package/assiduous-build/docs/index.html 2>/dev/null || true

echo "✅ MD to HTML sync complete!"
echo "📊 Summary:"
echo "  - Root MD files synced: $(ls -1 *.md 2>/dev/null | wc -l)"
echo "  - Docs MD files synced: $(ls -1 docs/*.md 2>/dev/null | wc -l)"
echo "  - Total HTML files: $(ls -1 docs/*.html 2>/dev/null | wc -l)"
echo ""
echo "📚 Document hub available at: /docs/index.html"