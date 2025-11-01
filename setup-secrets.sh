#!/bin/bash

echo "==================================================="
echo "AssiduousFlip - Firebase Secrets Setup"
echo "==================================================="
echo ""
echo "This script will help you set up the required secrets"
echo "for SendGrid, Twilio, and Stripe integrations."
echo ""
echo "You'll need to have your API keys ready."
echo ""

# Function to set a secret
set_secret() {
    local secret_name=$1
    local description=$2
    
    echo ""
    echo "Setting up: $description"
    echo "-----------------------------------"
    echo "Please enter the value for $secret_name:"
    echo "(Leave blank to skip this secret)"
    read -s secret_value
    
    if [ ! -z "$secret_value" ]; then
        echo "$secret_value" | firebase functions:secrets:set $secret_name --project assiduous-prod
        echo "✅ $secret_name configured"
    else
        echo "⏭️  Skipped $secret_name"
    fi
}

# SendGrid Configuration
echo ""
echo "📧 SENDGRID CONFIGURATION"
echo "========================="
echo "Get your API key from: https://app.sendgrid.com/settings/api_keys"
set_secret "SENDGRID_API_KEY" "SendGrid API Key"

echo ""
echo "Enter the 'from' email address for SendGrid (e.g., noreply@assiduousflip.com):"
read from_email
if [ ! -z "$from_email" ]; then
    echo "$from_email" | firebase functions:secrets:set SENDGRID_FROM_EMAIL --project assiduous-prod
    echo "✅ SENDGRID_FROM_EMAIL configured"
fi

# Twilio Configuration
echo ""
echo "📱 TWILIO CONFIGURATION (Optional)"
echo "=================================="
echo "Get your credentials from: https://console.twilio.com"
echo "Press Enter to skip if you don't have Twilio set up yet."
set_secret "TWILIO_ACCOUNT_SID" "Twilio Account SID"
set_secret "TWILIO_AUTH_TOKEN" "Twilio Auth Token"

echo ""
echo "Enter your Twilio phone number (e.g., +1234567890):"
read twilio_phone
if [ ! -z "$twilio_phone" ]; then
    echo "$twilio_phone" | firebase functions:secrets:set TWILIO_FROM_NUMBER --project assiduous-prod
    echo "✅ TWILIO_FROM_NUMBER configured"
fi

# Stripe Configuration
echo ""
echo "💳 STRIPE CONFIGURATION (Optional)"
echo "=================================="
echo "Get your keys from: https://dashboard.stripe.com/apikeys"
echo "Press Enter to skip if you don't have Stripe set up yet."
set_secret "STRIPE_SECRET_KEY" "Stripe Secret Key (starts with sk_)"
set_secret "STRIPE_WEBHOOK_SECRET" "Stripe Webhook Signing Secret (starts with whsec_)"

echo ""
echo "==================================================="
echo "✅ Secrets configuration complete!"
echo ""
echo "To verify your secrets are set, run:"
echo "  gcloud secrets list --project=assiduous-prod"
echo ""
echo "Next steps:"
echo "1. Deploy functions: firebase deploy --only functions --project assiduous-prod"
echo "2. Test authentication at: https://www.assiduousflip.com/login.html"
echo "==================================================="