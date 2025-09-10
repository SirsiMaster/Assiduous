#!/bin/bash

# Git Sync Script - Prevents merge commit messages
# This script safely syncs your local branch with remote

echo "🔄 Syncing with GitHub..."

# Stash any uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
    echo "📦 Stashing local changes..."
    git stash push -m "Auto-stash before sync $(date +%Y%m%d-%H%M%S)"
fi

# Fetch latest from remote
echo "📥 Fetching latest changes..."
git fetch origin main

# Rebase instead of merge to avoid merge commits
echo "🔀 Rebasing local changes..."
git rebase origin/main

# Check if rebase was successful
if [ $? -eq 0 ]; then
    echo "✅ Successfully synced with remote!"
    
    # Check if we had stashed changes
    if git stash list | grep -q "Auto-stash before sync"; then
        echo "📦 Restoring stashed changes..."
        git stash pop
    fi
else
    echo "❌ Rebase failed. You may have conflicts to resolve."
    echo "Run 'git rebase --abort' to cancel, or resolve conflicts and run 'git rebase --continue'"
fi

echo ""
echo "📊 Current status:"
git status --short
