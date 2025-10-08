#!/bin/bash

# VGCMail Deployment Script for DigitalOcean
# This script pulls the latest changes and restarts services

set -e  # Exit on error

echo "🚀 Starting VGCMail deployment..."

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "📍 Working directory: $SCRIPT_DIR"

# Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

# Update backend
echo "🔧 Updating backend..."
cd backend

# Check if package.json changed
if git diff --name-only HEAD@{1} HEAD | grep -q "backend/package.json"; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

# Stop existing backend process
echo "🛑 Stopping existing backend process..."
pkill -f "node server.js" || true
sleep 2

# Start backend
echo "▶️  Starting backend..."
nohup node server.js > server.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"

# Wait for backend to start
sleep 3

# Check if backend is running
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Backend health check passed"
else
    echo "❌ Backend health check failed"
    exit 1
fi

# Update frontend
echo "🔧 Updating frontend..."
cd ../frontend

# Check if package.json changed
if git diff --name-only HEAD@{1} HEAD | grep -q "frontend/package.json"; then
    echo "📦 Installing frontend dependencies..."
    pnpm install
fi

# Build frontend
echo "🏗️  Building frontend..."
pnpm run build

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📊 Status:"
echo "  Backend: http://localhost:3001/health"
echo "  Frontend: https://vgcmail.app"
echo ""
echo "📝 Next steps:"
echo "  1. Clean up database (see database_cleanup_final.sql)"
echo "  2. Update Chrome extension"
echo "  3. Test the complete workflow"
echo ""
echo "📋 View backend logs:"
echo "  tail -f $SCRIPT_DIR/backend/server.log"
