#!/bin/bash

# OpenSign Integration Deployment Script
# Assiduous Platform - Document Signing Setup

set -e

echo "════════════════════════════════════════════════════════════════"
echo "   OpenSign Integration Deployment for Assiduous Platform"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi
print_status "Docker installed"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi
print_status "Docker Compose installed"

# Check Firebase CLI
if ! command -v firebase &> /dev/null; then
    print_warning "Firebase CLI is not installed. Installing..."
    npm install -g firebase-tools
fi
print_status "Firebase CLI ready"

echo ""
echo "🔐 Setting up environment..."

# Create .env.opensign if it doesn't exist
if [ ! -f .env.opensign ]; then
    cp .env.opensign.example .env.opensign
    print_warning "Created .env.opensign from template"
    print_warning "Please edit .env.opensign with your actual values before continuing"
    read -p "Press enter when you've updated .env.opensign..."
fi
print_status "Environment configured"

echo ""
echo "🐳 Starting OpenSign services..."

# Start OpenSign with Docker Compose
docker-compose -f docker-compose.opensign.yml up -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 10

# Check if services are running
if docker ps | grep -q assiduous-opensign; then
    print_status "OpenSign service running"
else
    print_error "OpenSign service failed to start"
    exit 1
fi

if docker ps | grep -q assiduous-parse-server; then
    print_status "Parse Server running"
else
    print_error "Parse Server failed to start"
    exit 1
fi

if docker ps | grep -q assiduous-opensign-mongodb; then
    print_status "MongoDB running"
else
    print_error "MongoDB failed to start"
    exit 1
fi

echo ""
echo "🔥 Deploying Firebase components..."

# Deploy Firestore rules
echo "Deploying updated Firestore rules..."
if [ -f firebase-migration-package/firestore.rules.updated ]; then
    cp firebase-migration-package/firestore.rules.updated firebase-migration-package/firestore.rules
    cd firebase-migration-package
    firebase deploy --only firestore:rules
    cd ..
    print_status "Firestore rules deployed"
else
    print_warning "Updated Firestore rules not found, skipping..."
fi

# Install Functions dependencies
echo "Installing Cloud Functions dependencies..."
cd firebase-migration-package/functions
npm install
print_status "Dependencies installed"

# Deploy Cloud Functions
echo "Deploying Cloud Functions..."
firebase deploy --only functions
cd ../..
print_status "Cloud Functions deployed"

echo ""
echo "🎨 Setting up frontend..."

# Create symlink for easy access
if [ ! -L assiduousflip/admin/contracts/opensign ]; then
    ln -s signatures.html assiduousflip/admin/contracts/opensign
    print_status "Created frontend symlink"
fi

echo ""
echo "✅ Deployment Health Check..."

# Check OpenSign health
OPENSIGN_HEALTH=$(curl -s http://localhost:3000/health || echo "failed")
if [ "$OPENSIGN_HEALTH" != "failed" ]; then
    print_status "OpenSign API responding"
else
    print_warning "OpenSign API not responding on port 3000"
fi

# Check Parse Server
PARSE_HEALTH=$(curl -s http://localhost:1337/parse/health || echo "failed")
if [ "$PARSE_HEALTH" != "failed" ]; then
    print_status "Parse Server API responding"
else
    print_warning "Parse Server API not responding on port 1337"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "   🎉 OpenSign Integration Deployment Complete!"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "📌 Next Steps:"
echo "   1. Access OpenSign Dashboard: http://localhost:4040"
echo "   2. Access Admin Contracts: http://localhost:8080/assiduousflip/admin/contracts/signatures.html"
echo "   3. Create document templates in OpenSign"
echo "   4. Test signing workflow end-to-end"
echo ""
echo "📚 Documentation:"
echo "   - Integration Guide: docs/OPENSIGN_INTEGRATION.md"
echo "   - API Reference: docs/OPENSIGN_INTEGRATION.md#api-reference"
echo "   - Troubleshooting: docs/OPENSIGN_INTEGRATION.md#troubleshooting"
echo ""
echo "🔧 Useful Commands:"
echo "   - View logs: docker-compose -f docker-compose.opensign.yml logs -f"
echo "   - Stop services: docker-compose -f docker-compose.opensign.yml down"
echo "   - Restart services: docker-compose -f docker-compose.opensign.yml restart"
echo ""

# Create a status file for verification
cat > opensign-deployment-status.json << EOF
{
  "deployed_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "services": {
    "opensign": $(docker ps --format json --filter name=assiduous-opensign | head -1 || echo '{"status":"not running"}'),
    "parse_server": $(docker ps --format json --filter name=assiduous-parse-server | head -1 || echo '{"status":"not running"}'),
    "mongodb": $(docker ps --format json --filter name=assiduous-opensign-mongodb | head -1 || echo '{"status":"not running"}')
  },
  "firebase_functions": [
    "createSigningSession",
    "opensignWebhook",
    "verifyOtp",
    "generateOtp",
    "resendReminder",
    "scheduledExpireSessions",
    "downloadSignedDocument"
  ],
  "frontend_pages": [
    "/assiduousflip/admin/contracts/signatures.html"
  ]
}
EOF

print_status "Deployment status saved to opensign-deployment-status.json"
