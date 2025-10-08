# VGCMail - Quick Test Guide

## Immediate Actions Required

### 1. Clean Up Database (5 minutes)

The database has 51 old emails that need to be removed. These were imported via the old "Sync Gmail" feature and don't have tracking pixels.

**Steps:**

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Go to your project → **SQL Editor**
3. Copy and paste this SQL:

```sql
-- Remove all old tracked emails
DELETE FROM tracked_emails;

-- Reset tracking counter
UPDATE users SET emails_tracked_this_month = 0;

-- Verify cleanup
SELECT 'Tracked emails remaining' as status, COUNT(*) as count FROM tracked_emails;
SELECT 'User tracking count' as status, email, emails_tracked_this_month FROM users;
```

4. Click **Run**
5. You should see:
   - Tracked emails remaining: 0
   - User tracking count: 0

### 2. Update Chrome Extension (2 minutes)

**Steps:**

1. Download the updated extension:
   - Location: `/home/ubuntu/vgcmail-chrome-extension.zip`
   - Or download from server

2. Remove old extension:
   - Go to `chrome://extensions/`
   - Find "VGCMail - Email Tracking"
   - Click **Remove**

3. Install new extension:
   - Enable "Developer mode" (top right toggle)
   - Click **Load unpacked**
   - Select the extracted `vgcmail-chrome-extension` folder
   - Extension should load successfully

4. Connect extension:
   - Click extension icon in Chrome toolbar
   - Copy API key from dashboard (https://vgcmail.app/dashboard)
   - Paste into extension popup
   - Click **Connect**
   - Should show "Connected" status

### 3. Test Email Tracking (5 minutes)

**Steps:**

1. **Open Gmail** in the same browser where extension is installed

2. **Click "Compose"** to start new email

3. **Look for tracking toggle:**
   - Should see a green button: "✓ Tracking ON"
   - Located in the compose window toolbar (usually at bottom)
   - If you don't see it, wait 3 seconds (extension checks periodically)

4. **Compose test email:**
   - To: Your own email address (for testing)
   - Subject: "VGCMail Tracking Test"
   - Body: "This is a test email to verify tracking works"

5. **Verify tracking is ON:**
   - Green button should show "✓ Tracking ON"
   - If OFF (gray), click to toggle ON

6. **Send email:**
   - Click Send button
   - Email should send normally

7. **Check dashboard:**
   - Go to https://vgcmail.app/dashboard
   - Click **Refresh** button
   - Should see your test email in the list
   - Shows: Subject, Recipient, Sent time
   - Opens: 0, Clicks: 0

8. **Open the test email:**
   - Go to your inbox
   - Open the test email you just sent
   - Wait 5 seconds

9. **Check dashboard again:**
   - Click **Refresh**
   - Opens count should now be: 1
   - This confirms tracking is working!

---

## Expected Results

### ✅ Success Indicators

1. **Database cleaned:**
   - 0 tracked emails
   - Tracking counter reset to 0

2. **Extension working:**
   - Tracking toggle appears in Gmail compose
   - Green "✓ Tracking ON" button visible
   - Extension shows "Connected" status

3. **Email tracked:**
   - Test email appears in dashboard
   - Subject, recipient, and time are correct
   - Open count increases when email is opened

4. **Dashboard updated:**
   - Shows tracked emails correctly
   - No "Sync Gmail" button (removed)
   - Clear instructions for users

### ❌ Troubleshooting

**Tracking toggle doesn't appear:**
```
1. Open browser console (F12)
2. Look for "VGCMail" logs
3. Check if extension is enabled
4. Try refreshing Gmail page
5. Wait 3 seconds (periodic check)
```

**Dashboard shows no emails:**
```
1. Verify email was sent with tracking ON
2. Check backend logs:
   tail -f /home/ubuntu/vgcmail-app/backend/server.log
3. Verify Supabase connection
4. Check browser network tab for API errors
```

**Extension shows "Not Connected":**
```
1. Click extension icon
2. Get API key from dashboard
3. Paste and click Connect
4. Refresh Gmail page
```

**Opens not counting:**
```
1. Verify tracking pixel was injected (check email HTML)
2. Check if images are blocked in email client
3. Wait 30 seconds and refresh dashboard
4. Check backend logs for pixel requests
```

---

## Verification Commands

### Check Backend Status
```bash
curl http://localhost:3001/health
# Should return: {"status":"ok","message":"VGCMail API is running"}
```

### Check Backend Logs
```bash
tail -f /home/ubuntu/vgcmail-app/backend/server.log
```

### Check Frontend Status
```bash
curl http://localhost:5173
# Should return HTML
```

### Check Extension Files
```bash
ls -la /home/ubuntu/vgcmail-chrome-extension/
# Should show: manifest.json, scripts/, icons/, etc.
```

---

## What Changed

### Before Fix
- ❌ Dashboard showed "No tracked emails" despite 51 in database
- ❌ "Sync Gmail" imported all emails (wrong approach)
- ❌ Tracking counter exceeded limit (51/50)
- ❌ Extension tracking toggle might not appear

### After Fix
- ✅ Dashboard uses proper SQL aggregation
- ✅ "Sync Gmail" removed completely
- ✅ Only extension-tracked emails appear
- ✅ Improved extension compose detection
- ✅ Better visual design and error handling

---

## Key Files Changed

1. **Backend API:**
   - `/home/ubuntu/vgcmail-app/backend/server.js`
   - Fixed `/api/tracked-emails` endpoint
   - Now uses `email_stats` view for proper aggregation

2. **Frontend Dashboard:**
   - `/home/ubuntu/vgcmail-app/frontend/src/pages/DashboardPage.jsx`
   - Removed "Sync Gmail" feature
   - Updated UI with clear instructions

3. **Chrome Extension:**
   - `/home/ubuntu/vgcmail-chrome-extension/scripts/gmail-integration-v2.js`
   - Enhanced compose detection
   - Improved visual design
   - Better error handling

---

## Support

If you encounter issues:

1. **Check logs first:**
   - Browser console (F12)
   - Backend logs: `/home/ubuntu/vgcmail-app/backend/server.log`

2. **Verify services:**
   - Backend: `curl http://localhost:3001/health`
   - Frontend: `curl http://localhost:5173`
   - Database: Check Supabase dashboard

3. **Common fixes:**
   - Restart backend: `pkill node && cd /home/ubuntu/vgcmail-app/backend && nohup node server.js > server.log 2>&1 &`
   - Reload extension: Chrome → Extensions → Reload
   - Clear browser cache: Ctrl+Shift+Delete

---

**Ready to test!** Follow the steps above in order for best results.
