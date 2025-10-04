#!/bin/bash

# Manual GitHub webhook test
# Simulates a GitHub push event to test our automation pipeline

# Get the latest commit information
LATEST_COMMIT=$(git log -1 --pretty=format:'{"id": "%H", "message": "%s", "timestamp": "%cI", "author": {"name": "%an", "email": "%ae"}, "url": "https://github.com/SirsiMaster/Assiduous/commit/%H"}')

echo "🧪 Testing GitHub Webhook Automation Pipeline"
echo "=============================================="

# Create a simulated GitHub push payload
WEBHOOK_PAYLOAD=$(cat <<EOF
{
  "ref": "refs/heads/main",
  "before": "0000000000000000000000000000000000000000",
  "after": "c71bc78c71bc78c71bc78c71bc78c71bc78c71bc78",
  "repository": {
    "id": 123456789,
    "name": "Assiduous",
    "full_name": "SirsiMaster/Assiduous",
    "html_url": "https://github.com/SirsiMaster/Assiduous"
  },
  "commits": [
    $LATEST_COMMIT
  ],
  "head_commit": $LATEST_COMMIT,
  "pusher": {
    "name": "SirsiMaster",
    "email": "contact@sirsi.io"
  }
}
EOF
)

echo "📤 Sending webhook payload to Firebase Function..."
echo "Webhook URL: https://us-central1-assiduous-prod.cloudfunctions.net/githubWebhook"
echo ""

# Send the webhook payload
RESPONSE=$(curl -s -X POST https://us-central1-assiduous-prod.cloudfunctions.net/githubWebhook \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -d "$WEBHOOK_PAYLOAD")

echo "📥 Response from webhook:"
echo "$RESPONSE" | jq '.' || echo "$RESPONSE"

# Check if the response indicates success
if echo "$RESPONSE" | grep -q '"success":true'; then
  echo ""
  echo "✅ Webhook test SUCCESSFUL!"
  echo "🔄 Your commit should now be processed and appear in the dashboard"
  echo ""
  echo "🔗 Check the dashboard:"
  echo "• Local: http://localhost:8080/AssiduousFlip/admin/development/dashboard.html"
  echo "• Live: https://assiduous-prod.web.app/AssiduousFlip/admin/development/dashboard.html"
  echo ""
  echo "🎉 100% AUTOMATION IS WORKING!"
else
  echo ""
  echo "❌ Webhook test failed"
  echo "Check the Firebase Functions logs for more details:"
  echo "firebase functions:log --only githubWebhook"
fi
