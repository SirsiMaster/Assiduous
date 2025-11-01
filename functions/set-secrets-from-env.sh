#!/bin/bash

echo "=========================================="
echo "Setting Firebase Secrets from .env file"
echo "=========================================="
echo ""

# Load .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "Error: .env file not found!"
    exit 1
fi

# Set SendGrid secrets
echo "Setting SendGrid secrets..."
echo "$SENDGRID_API_KEY" | firebase functions:secrets:set SENDGRID_API_KEY --project assiduous-prod --force
echo "$NOTIFICATION_EMAIL" | firebase functions:secrets:set SENDGRID_FROM_EMAIL --project assiduous-prod --force

# Set Stripe secrets
echo ""
echo "Setting Stripe secrets..."
echo "$STRIPE_SECRET_KEY" | firebase functions:secrets:set STRIPE_SECRET_KEY --project assiduous-prod --force
echo "$STRIPE_WEBHOOK_SECRET" | firebase functions:secrets:set STRIPE_WEBHOOK_SECRET --project assiduous-prod --force

# For Twilio, we'll set placeholder values since they're not in .env yet
echo ""
echo "Setting Twilio placeholders (update when you have credentials)..."
echo "twilio_placeholder" | firebase functions:secrets:set TWILIO_ACCOUNT_SID --project assiduous-prod --force
echo "twilio_placeholder" | firebase functions:secrets:set TWILIO_AUTH_TOKEN --project assiduous-prod --force
echo "+1234567890" | firebase functions:secrets:set TWILIO_FROM_NUMBER --project assiduous-prod --force

echo ""
echo "=========================================="
echo "✅ Secrets configuration complete!"
echo ""
echo "Secrets set:"
echo "  - SENDGRID_API_KEY"
echo "  - SENDGRID_FROM_EMAIL (using $NOTIFICATION_EMAIL)"
echo "  - STRIPE_SECRET_KEY"
echo "  - STRIPE_WEBHOOK_SECRET"
echo "  - TWILIO_* (placeholders - update when ready)"
echo ""
echo "Next step: Deploy functions"
echo "  firebase deploy --only functions --project assiduous-prod"
echo "=========================================="