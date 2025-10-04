#!/bin/bash

# Setup Firebase CI/CD Authentication
# This script helps you set up the Firebase token for GitHub Actions

echo "======================================"
echo "Firebase CI/CD Setup for GitHub Actions"
echo "======================================"
echo ""

echo "This script will help you:"
echo "1. Generate a Firebase CI token"
echo "2. Add it to your GitHub repository secrets"
echo ""

# Check if firebase-tools is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
else
    echo "✅ Firebase CLI found"
fi

echo ""
echo "Step 1: Generating Firebase CI Token"
echo "-------------------------------------"
echo "You will be redirected to your browser to authenticate with Firebase."
echo "After authentication, a token will be generated."
echo ""
echo "Press Enter to continue..."
read

# Generate Firebase token
echo "Generating Firebase CI token..."
firebase login:ci

echo ""
echo "Step 2: Add Token to GitHub Secrets"
echo "-----------------------------------"
echo "Copy the token above and add it to your GitHub repository:"
echo ""
echo "1. Go to: https://github.com/SirsiMaster/Assiduous/settings/secrets/actions"
echo "2. Click 'New repository secret'"
echo "3. Name: FIREBASE_TOKEN"
echo "4. Value: [Paste the token from above]"
echo "5. Click 'Add secret'"
echo ""
echo "Step 3: Verify Setup"
echo "-------------------"
echo "After adding the secret, the GitHub Action will automatically:"
echo "✅ Deploy to Firebase on every push to main branch"
echo "✅ Update deployment analytics"
echo "✅ Track deployment metrics in FirebaseAnalyticsService"
echo "✅ Generate deployment summaries"
echo ""
echo "Optional: Test the workflow manually"
echo "------------------------------------"
echo "1. Go to: https://github.com/SirsiMaster/Assiduous/actions"
echo "2. Select 'Deploy to Firebase Hosting on Push to Main'"
echo "3. Click 'Run workflow' > 'Run workflow'"
echo ""
echo "======================================"
echo "Setup Complete!"
echo "======================================"
