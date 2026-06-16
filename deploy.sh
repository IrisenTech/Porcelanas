#!/bin/bash
##
## deploy.sh — Build and deploy Porcelanas to VPS
## Usage: bash deploy.sh
## Requires: Node.js 18+, PM2 (npm i -g pm2), Nginx
##

set -e

DEPLOY_DIR="/var/www/porcelanas"
FRONTEND_DIR="./frontend"
SERVER_DIR="./server"

echo "🏺 Porcelanas Deploy Script"
echo "─────────────────────────────"

# 1. Build frontend
echo "📦 Building frontend..."
cd "$FRONTEND_DIR"
npm install --frozen-lockfile
npm run build
cd ..

# 2. Copy dist to web root
echo "🚚 Copying dist to $DEPLOY_DIR..."
sudo mkdir -p "$DEPLOY_DIR"
sudo rsync -av --delete "$FRONTEND_DIR/dist/" "$DEPLOY_DIR/"

# 3. Start/restart backend with PM2
echo "🚀 Starting backend server..."
cd "$SERVER_DIR"
npm install --frozen-lockfile 2>/dev/null || true
cd ..
pm2 startOrRestart ecosystem.config.js --env production 2>/dev/null || \
  pm2 start "$SERVER_DIR/index.js" --name porcelanas-backend
pm2 save

echo ""
echo "✅ Deploy complete!"
echo "   Frontend: $DEPLOY_DIR"
echo "   Backend:  http://localhost:3001"
echo ""
echo "If this is your first deploy, run:"
echo "   sudo nginx -t && sudo systemctl reload nginx"
