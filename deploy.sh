#!/bin/bash
# Nusantara CRM - Deployment Script
# Usage: ./deploy.sh [production|staging]
# Example: ./deploy.sh production

set -e  # Exit on error

# ─── Configuration ──────────────────────────────────────────
DEPLOY_ENV=${1:-production}
VPS_HOST="your-vps-host"        # Replace with your VPS IP or hostname
VPS_USER="root"                 # VPS username
VPS_PATH="/var/www/nusantara-crm"  # Path on VPS
DB_PATH="./src/data/db.json"     # Local database path

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}  Nusantara CRM Deployment Script${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "Environment: ${YELLOW}$DEPLOY_ENV${NC}"
echo ""

# ─── Pre-flight Checks ──────────────────────────────────────
echo -e "${YELLOW}→ Running pre-flight checks...${NC}"

# Check if build exists
if [ ! -d "dist" ]; then
    echo -e "${RED}✗ dist/ folder not found. Running build first...${NC}"
    npm run build
fi

# Check if rsync is available
if ! command -v rsync &> /dev/null; then
    echo -e "${RED}✗ rsync not found. Please install rsync.${NC}"
    exit 1
fi

# Check git status (warn if uncommitted changes)
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠ Warning: You have uncommitted changes:${NC}"
    git status --short
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo -e "${GREEN}✓ Pre-flight checks passed${NC}"
echo ""

# ─── Build ─────────────────────────────────────────────────
echo -e "${YELLOW}→ Building application...${NC}"
npm run build
echo -e "${GREEN}✓ Build complete${NC}"
echo ""

# ─── Sync Files ─────────────────────────────────────────────
echo -e "${YELLOW}→ Syncing files to VPS...${NC}"

# Create remote directory if it doesn't exist
ssh $VPS_USER@$VPS_HOST "mkdir -p $VPS_PATH"

# Sync dist folder (exclude node_modules and git)
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '*.log' \
    dist/ $VPS_USER@$VPS_HOST:$VPS_PATH/dist/

# Sync database file
rsync -avz $DB_PATH $VPS_USER@$VPS_HOST:$VPS_PATH/src/data/db.json

echo -e "${GREEN}✓ Files synced${NC}"
echo ""

# ─── Install Dependencies on VPS ─────────────────────────────
echo -e "${YELLOW}→ Installing dependencies on VPS...${NC}"
ssh $VPS_USER@$VPS_HOST "cd $VPS_PATH && npm install --production"
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# ─── Restart PM2 ───────────────────────────────────────────
echo -e "${YELLOW}→ Restarting PM2 services...${NC}"
ssh $VPS_USER@$VPS_HOST "cd $VPS_PATH && pm2 restart ecosystem.config.js || pm2 start ecosystem.config.js"
ssh $VPS_USER@$VPS_HOST "pm2 save"
echo -e "${GREEN}✓ PM2 services restarted${NC}"
echo ""

# ─── Reload Nginx ──────────────────────────────────────────
echo -e "${YELLOW}→ Reloading Nginx...${NC}"
ssh $VPS_USER@$VPS_HOST "nginx -t && systemctl reload nginx"
echo -e "${GREEN}✓ Nginx reloaded${NC}"
echo ""

# ─── Final Status ──────────────────────────────────────────
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo ""
echo -e "App URL: ${YELLOW}http://$VPS_HOST${NC}"
echo -e "API URL: ${YELLOW}http://$VPS_HOST/api${NC}"
echo ""
echo -e "PM2 Status:"
ssh $VPS_USER@$VPS_HOST "pm2 status"
echo ""
echo -e "${GREEN}Done!${NC}"
