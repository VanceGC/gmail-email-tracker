# One-Click Extension Connection - Deployment Guide

## Overview

This update adds one-click extension connection functionality, eliminating the need for users to manually copy API keys.

## What's New

- **Database:** API key support for Chrome extension authentication
- **Backend:** New API endpoints for API key generation and verification
- **Frontend:** Connection UI with automatic extension detection
- **Extension:** Updated to receive API keys from dashboard automatically

## Deployment Steps

### Step 1: Pull Latest Changes

On your server:

```bash
cd /home/vgcmail/gmail-email-tracker
git pull origin main
```

### Step 2: Run Database Migration

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your VGCMail project
3. Click **SQL Editor**
4. Click **New query**
5. Copy contents of `add_api_key_migration.sql` from the repository
6. Click **Run**
7. Should see: "Success. No rows returned"

### Step 3: Update Backend

```bash
cd /home/vgcmail/gmail-email-tracker/backend

# Verify changes
git diff HEAD~1 server.js

# Restart backend
pm2 restart vgcmail-api

# Check logs
pm2 logs vgcmail-api --lines 50

# Test health endpoint
curl https://api.vgcmail.app/health
```

### Step 4: Update Frontend

```bash
cd /home/vgcmail/gmail-email-tracker/frontend

# Install any new dependencies (if needed)
npm install

# Update Extension ID in DashboardPage.jsx
# Edit line 8 after loading extension (see step 5)
nano src/pages/DashboardPage.jsx

# Build
npm run build

# Restart frontend
pm2 restart vgcmail-frontend
```

### Step 5: Load Extension and Get ID

1. Download extension from repository or use `vgcmail-chrome-extension.zip`
2. Extract to a folder
3. Open Chrome → `chrome://extensions/`
4. Enable "Developer mode"
5. Click "Load unpacked"
6. Select the extracted folder
7. **Copy the Extension ID** (long string under extension name)

### Step 6: Update Extension ID in Dashboard

```bash
cd /home/vgcmail/gmail-email-tracker/frontend

# Edit DashboardPage.jsx
nano src/pages/DashboardPage.jsx

# Find line 8:
const EXTENSION_ID = 'YOUR_EXTENSION_ID';

# Replace with your actual extension ID:
const EXTENSION_ID = 'abcdefghijklmnopqrstuvwxyz123456';

# Save and rebuild
npm run build

# Restart
pm2 restart vgcmail-frontend
```

### Step 7: Test

1. **Backend API:**
```bash
curl https://api.vgcmail.app/health
```

2. **Frontend:**
- Go to https://vgcmail.app/dashboard
- Should see "Connect Chrome Extension" banner
- Should show "Extension detected" if extension is installed

3. **Extension Connection:**
- Click "Connect Extension" button
- Should see success message
- Extension popup should show connected status

4. **Email Tracking:**
- Open Gmail
- Compose new email
- Should see tracking toggle
- Send email
- Check dashboard for tracked email

## Files Changed

### Backend
- `backend/server.js` - Added API key endpoints and authentication

### Frontend
- `frontend/src/pages/DashboardPage.jsx` - Added connection UI

### Database
- `add_api_key_migration.sql` - New migration for API key support

## New API Endpoints

- `POST /api/generate-api-key` - Generate API key for authenticated user
- `GET /api/get-api-key` - Get user's existing API key
- `POST /api/verify-key` - Verify API key (updated)
- `POST /api/track/create` - Create tracking (updated to support API keys)

## Troubleshooting

### SQL Migration Fails
- Make sure you're using `add_api_key_migration.sql` (correct version)
- Check Supabase logs for specific error
- Verify you have proper permissions

### Backend Won't Start
```bash
pm2 logs vgcmail-api --lines 100
node -c /home/vgcmail/gmail-email-tracker/backend/server.js
```

### Extension Not Detected
- Verify extension is installed and enabled
- Check extension ID is correct in DashboardPage.jsx
- Refresh dashboard page
- Check browser console (F12)

### Connection Fails
- Check browser console for errors
- Check backend logs: `pm2 logs vgcmail-api`
- Verify database migration completed
- Test API endpoints with curl

## Rollback

If you need to rollback:

```bash
cd /home/vgcmail/gmail-email-tracker
git log --oneline  # Find previous commit
git checkout <previous-commit-hash>
pm2 restart vgcmail-api
pm2 restart vgcmail-frontend
```

## Support

Check logs:
- Backend: `pm2 logs vgcmail-api`
- Frontend: `pm2 logs vgcmail-frontend`
- Browser: F12 → Console
- Extension: chrome://extensions/ → Service worker → Console

---

**Version:** 1.0.0 - One-Click Extension Connection
**Date:** October 7, 2025
