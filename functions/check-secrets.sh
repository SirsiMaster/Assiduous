#!/bin/bash

echo "Checking Firebase Secrets Configuration for AssiduousFlip"
echo "=========================================================="
echo ""

# Check SendGrid secrets
echo "📧 Checking SendGrid Configuration..."
echo -n "  SENDGRID_API_KEY: "
if gcloud secrets versions list SENDGRID_API_KEY --project=assiduous-prod 2>/dev/null | grep -q "ENABLED"; then
    echo "✅ Configured"
else
    echo "❌ Not found"
fi

echo -n "  SENDGRID_FROM_EMAIL: "
if gcloud secrets versions list SENDGRID_FROM_EMAIL --project=assiduous-prod 2>/dev/null | grep -q "ENABLED"; then
    echo "✅ Configured"
else
    echo "❌ Not found"
fi

echo ""

# Check Twilio secrets
echo "📱 Checking Twilio Configuration..."
echo -n "  TWILIO_ACCOUNT_SID: "
if gcloud secrets versions list TWILIO_ACCOUNT_SID --project=assiduous-prod 2>/dev/null | grep -q "ENABLED"; then
    echo "✅ Configured"
else
    echo "❌ Not found"
fi

echo -n "  TWILIO_AUTH_TOKEN: "
if gcloud secrets versions list TWILIO_AUTH_TOKEN --project=assiduous-prod 2>/dev/null | grep -q "ENABLED"; then
    echo "✅ Configured"
else
    echo "❌ Not found"
fi

echo -n "  TWILIO_FROM_NUMBER: "
if gcloud secrets versions list TWILIO_FROM_NUMBER --project=assiduous-prod 2>/dev/null | grep -q "ENABLED"; then
    echo "✅ Configured"
else
    echo "❌ Not found"
fi

echo ""

# Check Stripe secrets
echo "💳 Checking Stripe Configuration..."
echo -n "  STRIPE_SECRET_KEY: "
if gcloud secrets versions list STRIPE_SECRET_KEY --project=assiduous-prod 2>/dev/null | grep -q "ENABLED"; then
    echo "✅ Configured"
else
    echo "❌ Not found"
fi

echo -n "  STRIPE_WEBHOOK_SECRET: "
if gcloud secrets versions list STRIPE_WEBHOOK_SECRET --project=assiduous-prod 2>/dev/null | grep -q "ENABLED"; then
    echo "✅ Configured"
else
    echo "❌ Not found"
fi

echo ""
echo "=========================================================="
echo "To set a secret, use:"
echo "  firebase functions:secrets:set SECRET_NAME --project assiduous-prod"
echo ""
echo "To attach secrets to functions, update functions/src/index.ts with:"
echo "  import {defineSecret} from 'firebase-functions/v2';"
echo "  const sendgridApiKey = defineSecret('SENDGRID_API_KEY');"
echo ""