#!/bin/bash

# Domain Status Checker for assiduousflip.com
# Monitors DNS propagation and domain accessibility

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Custom Domain Status Check: assiduousflip.com${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "$(date '+%Y-%m-%d %H:%M:%S %Z')"
echo ""

# Function to check DNS
check_dns() {
    local domain=$1
    local name=$2
    
    echo -e "${BLUE}🔍 Checking DNS for ${name}...${NC}"
    
    # Check Google DNS
    local google_ip=$(dig +short "$domain" @8.8.8.8 | grep -E '^[0-9.]+$' | head -1)
    
    if [ -n "$google_ip" ]; then
        if [ "$google_ip" = "199.36.158.100" ]; then
            echo -e "${GREEN}✅ Google DNS (8.8.8.8): ${google_ip}${NC}"
        else
            echo -e "${YELLOW}⚠️  Google DNS (8.8.8.8): ${google_ip} (unexpected IP)${NC}"
        fi
    else
        echo -e "${RED}❌ Google DNS (8.8.8.8): Not propagated yet${NC}"
    fi
    
    # Check Cloudflare DNS
    local cloudflare_ip=$(dig +short "$domain" @1.1.1.1 | grep -E '^[0-9.]+$' | head -1)
    
    if [ -n "$cloudflare_ip" ]; then
        if [ "$cloudflare_ip" = "199.36.158.100" ]; then
            echo -e "${GREEN}✅ Cloudflare DNS (1.1.1.1): ${cloudflare_ip}${NC}"
        else
            echo -e "${YELLOW}⚠️  Cloudflare DNS (1.1.1.1): ${cloudflare_ip} (unexpected IP)${NC}"
        fi
    else
        echo -e "${RED}❌ Cloudflare DNS (1.1.1.1): Not propagated yet${NC}"
    fi
    
    echo ""
}

# Function to check HTTP/HTTPS accessibility
check_accessibility() {
    local url=$1
    local name=$2
    
    echo -e "${BLUE}🌐 Checking ${name} accessibility...${NC}"
    
    # Check HTTP
    local http_status=$(curl -I -s --max-time 5 "http://$url" 2>&1 | head -1 | awk '{print $2}')
    
    if [ -n "$http_status" ]; then
        case $http_status in
            200)
                echo -e "${GREEN}✅ HTTP: $http_status OK${NC}"
                ;;
            301|302)
                echo -e "${YELLOW}🔄 HTTP: $http_status Redirect (normal)${NC}"
                ;;
            500)
                echo -e "${RED}❌ HTTP: $http_status Domain Not Found (DNS not propagated)${NC}"
                ;;
            *)
                echo -e "${YELLOW}⚠️  HTTP: $http_status${NC}"
                ;;
        esac
    else
        echo -e "${RED}❌ HTTP: Connection failed${NC}"
    fi
    
    # Check HTTPS
    local https_status=$(curl -I -s --max-time 5 "https://$url" 2>&1 | head -1 | awk '{print $2}')
    
    if [ -n "$https_status" ]; then
        case $https_status in
            200)
                echo -e "${GREEN}✅ HTTPS: $https_status OK${NC}"
                ;;
            301|302)
                echo -e "${YELLOW}🔄 HTTPS: $https_status Redirect (normal)${NC}"
                ;;
            *)
                echo -e "${YELLOW}⚠️  HTTPS: $https_status${NC}"
                ;;
        esac
    else
        echo -e "${YELLOW}⏳ HTTPS: Not yet available (SSL provisioning)${NC}"
    fi
    
    echo ""
}

# Check root domain DNS
echo -e "${BLUE}━━━ ROOT DOMAIN (assiduousflip.com) ━━━${NC}"
check_dns "assiduousflip.com" "Root Domain"
check_accessibility "assiduousflip.com" "Root Domain"

# Check www subdomain DNS
echo -e "${BLUE}━━━ WWW SUBDOMAIN (www.assiduousflip.com) ━━━${NC}"
check_dns "www.assiduousflip.com" "WWW Subdomain"
check_accessibility "www.assiduousflip.com" "WWW Subdomain"

# Check Firebase URLs
echo -e "${BLUE}━━━ FIREBASE HOSTING URLS ━━━${NC}"
echo -e "${BLUE}🔍 Checking Firebase staging...${NC}"
staging_status=$(curl -I -s --max-time 5 "https://assiduous-staging.web.app/" | head -1 | awk '{print $2}')
if [ "$staging_status" = "200" ]; then
    echo -e "${GREEN}✅ Staging: https://assiduous-staging.web.app/ - $staging_status OK${NC}"
else
    echo -e "${RED}❌ Staging: $staging_status${NC}"
fi

echo -e "${BLUE}🔍 Checking Firebase production...${NC}"
prod_status=$(curl -I -s --max-time 5 "https://assiduous-prod.web.app/" | head -1 | awk '{print $2}')
if [ "$prod_status" = "200" ]; then
    echo -e "${GREEN}✅ Production: https://assiduous-prod.web.app/ - $prod_status OK${NC}"
else
    echo -e "${RED}❌ Production: $prod_status${NC}"
fi

echo ""

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 SUMMARY${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if root domain is ready
root_ready=$(dig +short assiduousflip.com @8.8.8.8 | grep -E '^[0-9.]+$' | head -1)
www_ready=$(dig +short www.assiduousflip.com @8.8.8.8 | grep -E '^[0-9.]+$' | head -1)

if [ "$root_ready" = "199.36.158.100" ] && [ "$www_ready" = "199.36.158.100" ]; then
    echo -e "${GREEN}🎉 DNS FULLY PROPAGATED!${NC}"
    echo ""
    echo -e "${GREEN}✅ Root domain DNS: Ready${NC}"
    echo -e "${GREEN}✅ WWW subdomain DNS: Ready${NC}"
    echo ""
    echo -e "${YELLOW}⏭️  NEXT STEP: Add custom domain in Firebase Console${NC}"
    echo -e "   👉 https://console.firebase.google.com/project/assiduous-prod/hosting/sites"
    echo ""
elif [ "$www_ready" = "199.36.158.100" ]; then
    echo -e "${YELLOW}⏳ DNS PARTIALLY PROPAGATED${NC}"
    echo ""
    echo -e "${RED}❌ Root domain DNS: Not yet propagated${NC}"
    echo -e "${GREEN}✅ WWW subdomain DNS: Ready${NC}"
    echo ""
    echo -e "${YELLOW}⏳ Wait 1-2 hours and run this script again${NC}"
    echo -e "   Command: ./scripts/check-domain-status.sh"
    echo ""
else
    echo -e "${RED}❌ DNS NOT YET PROPAGATED${NC}"
    echo ""
    echo -e "${RED}❌ Root domain DNS: Not propagated${NC}"
    if [ "$www_ready" = "199.36.158.100" ]; then
        echo -e "${GREEN}✅ WWW subdomain DNS: Ready${NC}"
    else
        echo -e "${RED}❌ WWW subdomain DNS: Not propagated${NC}"
    fi
    echo ""
    echo -e "${YELLOW}⏳ Wait 1-2 hours and run this script again${NC}"
    echo -e "   Command: ./scripts/check-domain-status.sh"
    echo ""
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📖 Documentation:${NC}"
echo -e "   - Status: DOMAIN_STATUS.md"
echo -e "   - Setup guide: CUSTOM_DOMAIN_SETUP.md"
echo -e "   - GoDaddy DNS: https://dcc.godaddy.com/control/assiduousflip.com/dns"
echo ""
