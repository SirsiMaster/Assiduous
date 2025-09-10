#!/bin/bash
# Update all sidebar links to use relative paths without /admin/

sed -i.bak 's|\[\[BASE\]\]/admin/|\[\[BASE\]\]|g' assiduous-build/components/sidebar.html

echo "Updated sidebar links to use relative paths"
