# Gmail Email Tracker - Installation & Setup Guide

## Overview

This email tracking tool consists of two components:
1. **Backend Service** - Tracks email opens and clicks, provides dashboard
2. **Chrome Extension** - Integrates with Gmail to inject tracking

## Backend Service

### Deployed URL
Your backend service is now running at:
```
https://3000-iy6nmzokkz7wmzz95h54r-4252293f.manusvm.computer
```

### Dashboard Access
Visit the dashboard to view tracked emails:
```
https://3000-iy6nmzokkz7wmzz95h54r-4252293f.manusvm.computer/?user_id=your.email@gmail.com
```

Replace `your.email@gmail.com` with your actual Gmail address.

### API Endpoints

**Create Tracking Pixel:**
```bash
POST https://3000-iy6nmzokkz7wmzz95h54r-4252293f.manusvm.computer/api/pixels/create
Content-Type: application/json

{
  "email_subject": "Test Email",
  "recipient_email": "recipient@example.com",
  "user_id": "your.email@gmail.com",
  "links": ["https://example.com"]
}
```

**Get Tracked Emails:**
```bash
GET https://3000-iy6nmzokkz7wmzz95h54r-4252293f.manusvm.computer/api/pixels/your.email@gmail.com
```

## Chrome Extension Installation

### Step 1: Load the Extension

1. Open Google Chrome
2. Navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **Load unpacked**
5. Navigate to and select the `gmail-tracker-extension` folder
6. The extension should now appear in your extensions list

### Step 2: Configure the Extension

1. Click the extension icon (📧) in your Chrome toolbar
2. Enter the following settings:
   - **Backend Server URL:** `https://3000-iy6nmzokkz7wmzz95h54r-4252293f.manusvm.computer`
   - **Your Gmail Address:** Your actual Gmail address (e.g., `yourname@gmail.com`)
   - **Auto-track all outgoing emails:** Keep checked (enabled)
3. Click **Save Settings**
4. You should see "Connected to backend" status

### Step 3: Test the Tracking

1. Open Gmail (https://mail.google.com)
2. Compose a new email
3. You should see a "📧 Tracking enabled" indicator near the Send button
4. Send the email to yourself or a test account
5. Open the email in the recipient's inbox
6. Go back to the extension and click **Open Dashboard**
7. You should see the tracked email with open statistics

## How It Works

### Email Open Tracking

When you send an email with tracking enabled, the extension automatically injects a tiny 1x1 transparent tracking pixel image into the email HTML. The pixel's URL points to your backend service.

Example tracking pixel:
```html
<img src="https://3000-iy6nmzokkz7wmzz95h54r-4252293f.manusvm.computer/tracker/abc-123-def.png" 
     width="1" height="1" style="display:none;" alt="" />
```

When the recipient opens the email and their email client loads images, it makes a request to fetch this pixel. The backend service logs this request (timestamp, IP address, user agent) and serves the actual 1x1 PNG image.

### Link Click Tracking

All links in your email are automatically wrapped with tracking URLs that redirect through your backend service.

Original link:
```
https://example.com
```

Wrapped tracking link:
```
https://3000-iy6nmzokkz7wmzz95h54r-4252293f.manusvm.computer/click/xyz-789?redirect=https://example.com
```

When the recipient clicks the link, they are briefly redirected through your backend (which logs the click) before being forwarded to the original destination.

## Features

### ✅ What Works

- **Email open tracking** - Detects when emails are opened
- **Link click tracking** - Tracks clicks on links in emails
- **Real-time dashboard** - View tracking statistics instantly
- **Detailed logs** - See timestamp, IP address, and user agent for each event
- **Auto-tracking** - Automatically track all outgoing emails
- **Multiple emails** - Track unlimited emails
- **Privacy-focused** - All data stored on your own backend

### ⚠️ Limitations

1. **Gmail Image Proxy**
   - Gmail proxies all images through Google's servers
   - You'll see Google's proxy IP address instead of recipient's real IP
   - Gmail caches images, so you may only detect the first open reliably

2. **Image Blocking**
   - Some email clients block images by default
   - Tracking won't work until recipient enables images

3. **Privacy Considerations**
   - Recipients can detect tracking pixels if they inspect email HTML
   - Some users may consider email tracking invasive
   - Always comply with privacy laws and regulations

4. **Temporary Backend URL**
   - The current backend URL is temporary and will expire
   - For production use, deploy to a permanent server (see below)

## Production Deployment

For permanent deployment, you have several options:

### Option 1: Deploy to Cloud Platform

Deploy the backend service to platforms like:
- **Heroku** - Easy deployment with free tier
- **Railway** - Modern platform with simple deployment
- **DigitalOcean App Platform** - Scalable and affordable
- **AWS Elastic Beanstalk** - Enterprise-grade hosting
- **Google Cloud Run** - Serverless container deployment

### Option 2: Self-Host

Host on your own server:
1. Get a VPS (Virtual Private Server) from providers like DigitalOcean, Linode, or Vultr
2. Install Node.js and npm
3. Copy the `email-tracker` folder to your server
4. Set up a reverse proxy (nginx or Apache)
5. Configure SSL certificate (Let's Encrypt)
6. Run the service with PM2 or systemd

### Option 3: Use Docker

The backend can be containerized with Docker:

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t email-tracker .
docker run -p 3000:3000 -v $(pwd)/email-tracker.db:/app/email-tracker.db email-tracker
```

## Troubleshooting

### Extension Not Working

1. **Check extension is loaded:**
   - Go to `chrome://extensions/`
   - Ensure "Gmail Email Tracker" is enabled

2. **Check backend connection:**
   - Click extension icon
   - Verify "Connected to backend" status
   - If not connected, check backend URL

3. **Check Gmail page:**
   - Refresh Gmail page after installing extension
   - Extension only works on `https://mail.google.com/*`

### Tracking Not Recording

1. **Check backend is running:**
   - Visit backend URL in browser
   - Should see dashboard page

2. **Check settings:**
   - Ensure "Auto-track all outgoing emails" is enabled
   - Verify Gmail address is correct

3. **Check browser console:**
   - Open Chrome DevTools (F12)
   - Check Console tab for errors
   - Look for "Gmail Email Tracker" log messages

### No Opens Detected

1. **Images may be blocked:**
   - Recipient's email client may block images by default
   - Ask recipient to enable images

2. **Gmail caching:**
   - Gmail caches images after first load
   - Subsequent opens may not be detected

3. **Check tracking pixel:**
   - View email source in recipient's inbox
   - Verify tracking pixel is present in HTML

## Security & Privacy

### Data Storage

All tracking data is stored in SQLite database on your backend server:
- `email-tracker.db` - Contains all tracking information
- No third-party services have access to your data
- You have complete control over your data

### Authentication

The current implementation does not include authentication. For production use, consider adding:
- API key authentication for extension requests
- User login for dashboard access
- Rate limiting to prevent abuse

### GDPR Compliance

If you're in the EU or tracking EU recipients:
- Inform recipients that emails contain tracking
- Provide opt-out mechanism
- Include tracking disclosure in email footer
- Comply with GDPR data protection requirements

## Advanced Usage

### Manual Tracking

You can manually create tracking pixels via API:

```bash
curl -X POST https://3000-iy6nmzokkz7wmzz95h54r-4252293f.manusvm.computer/api/pixels/create \
  -H "Content-Type: application/json" \
  -d '{
    "email_subject": "My Email",
    "recipient_email": "recipient@example.com",
    "user_id": "sender@gmail.com",
    "links": ["https://example.com", "https://another-link.com"]
  }'
```

Response:
```json
{
  "pixel_id": "abc-123-def",
  "tracking_url": "https://3000-iy6nmzokkz7wmzz95h54r-4252293f.manusvm.computer/tracker/abc-123-def.png",
  "wrapped_links": {
    "https://example.com": "https://3000-iy6nmzokkz7wmzz95h54r-4252293f.manusvm.computer/click/xyz-789?redirect=https://example.com"
  }
}
```

Then manually insert the tracking pixel and wrapped links into your email HTML.

### Viewing Statistics

Get detailed statistics for a specific email:

```bash
curl https://3000-iy6nmzokkz7wmzz95h54r-4252293f.manusvm.computer/api/pixels/abc-123-def/stats
```

Response:
```json
{
  "opens": [
    {
      "id": 1,
      "pixel_id": "abc-123-def",
      "opened_at": "2025-10-06T15:30:00.000Z",
      "ip_address": "172.217.14.195",
      "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
    }
  ],
  "clicks": [
    {
      "id": 1,
      "link_id": "xyz-789",
      "clicked_at": "2025-10-06T15:35:00.000Z",
      "ip_address": "172.217.14.195",
      "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
      "original_url": "https://example.com"
    }
  ],
  "total_opens": 1,
  "total_clicks": 1
}
```

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the README.md files in both project folders
3. Check browser console for error messages
4. Verify backend server logs

## Next Steps

1. ✅ Install the Chrome extension
2. ✅ Configure with backend URL
3. ✅ Send a test email to yourself
4. ✅ Verify tracking works
5. 🔄 Consider deploying to permanent server for production use
6. 🔄 Add authentication for security
7. 🔄 Customize dashboard styling
8. 🔄 Add email notifications for opens/clicks

Enjoy tracking your emails! 📧✨
