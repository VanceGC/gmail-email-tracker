# Deploy VGCMail to DigitalOcean

## Prerequisites

- DigitalOcean droplet with Ubuntu
- Node.js 22.x installed
- Nginx configured
- Domain pointed to droplet
- Git installed

## Deployment Steps

### 1. Connect to Your DigitalOcean Droplet

```bash
ssh root@your_droplet_ip
```

### 2. Navigate to Application Directory

```bash
cd /path/to/vgcmail-app
```

### 3. Pull Latest Changes

```bash
git pull origin master
```

### 4. Update Backend

```bash
cd backend

# Install dependencies (if package.json changed)
npm install

# Restart backend service
pkill -f "node server.js"
nohup node server.js > server.log 2>&1 &

# Verify backend is running
curl http://localhost:3001/health
```

### 5. Update Frontend

```bash
cd ../frontend

# Install dependencies (if package.json changed)
pnpm install

# Rebuild frontend
pnpm run build

# Copy build to nginx directory (if needed)
# sudo cp -r dist/* /var/www/vgcmail.app/
```

### 6. Verify Deployment

```bash
# Check backend
curl http://localhost:3001/health

# Check frontend
curl https://vgcmail.app

# Check logs
tail -f /path/to/vgcmail-app/backend/server.log
```

## What Changed in This Update

### Backend Changes
- Fixed `/api/tracked-emails` endpoint to use `email_stats` view
- Added `gmailService.js` for Gmail API integration
- Improved data aggregation and formatting

### Frontend Changes
- Removed "Sync Gmail" feature
- Updated dashboard UI with clear instructions
- Changed to simple "Refresh" button
- Improved empty state messaging

### Database Changes
- No schema changes needed
- **Action Required:** Clean up 51 old tracked emails (see below)

## Database Cleanup (Required)

After deploying, run this in Supabase SQL Editor:

```sql
-- Remove old synced emails
DELETE FROM tracked_emails;

-- Reset tracking counter
UPDATE users SET emails_tracked_this_month = 0;

-- Verify
SELECT COUNT(*) FROM tracked_emails;
```

## Chrome Extension Update

The Chrome extension has also been updated. Users need to:

1. Download new version: `/home/ubuntu/vgcmail-chrome-extension.zip`
2. Remove old extension from Chrome
3. Install new version via "Load unpacked"
4. Reconnect with API key

## Environment Variables

Make sure these are set in your `.env` files:

### Backend (`backend/.env`)
```
PORT=3001
FRONTEND_URL=https://vgcmail.app
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### Frontend (`frontend/.env`)
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_API_URL=https://api.vgcmail.app
```

## Troubleshooting

### Backend won't start
```bash
# Check logs
tail -f backend/server.log

# Check if port is in use
lsof -i :3001

# Kill existing process
pkill -f "node server.js"
```

### Frontend not updating
```bash
# Clear build cache
cd frontend
rm -rf dist/ node_modules/.vite

# Rebuild
pnpm install
pnpm run build
```

### Nginx issues
```bash
# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Check logs
sudo tail -f /var/log/nginx/error.log
```

## Post-Deployment Checklist

- [ ] Backend health check responds: `curl http://localhost:3001/health`
- [ ] Frontend loads: `curl https://vgcmail.app`
- [ ] Database cleaned up (51 old emails removed)
- [ ] Chrome extension updated and tested
- [ ] Test complete workflow:
  - [ ] Login to dashboard
  - [ ] Dashboard shows no emails (after cleanup)
  - [ ] Install updated Chrome extension
  - [ ] Send test email with tracking ON
  - [ ] Email appears in dashboard
  - [ ] Open email and verify open count increases

## Rollback Plan

If something goes wrong:

```bash
# Rollback to previous commit
git log --oneline  # Find previous commit hash
git reset --hard <previous_commit_hash>

# Restart services
cd backend
pkill -f "node server.js"
nohup node server.js > server.log 2>&1 &

cd ../frontend
pnpm run build
```

## Support

For issues:
1. Check backend logs: `tail -f backend/server.log`
2. Check nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify environment variables are set correctly
4. Test API endpoints manually with curl

---

**Last Updated:** October 7, 2025  
**Version:** 2.0
