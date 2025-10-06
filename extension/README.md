# Gmail Email Tracker - Chrome Extension

A Chrome extension that tracks email opens and link clicks for Gmail, similar to Mailtrack and Mailsuite.

## Features

- **Email Open Tracking**: Know when recipients open your emails
- **Link Click Tracking**: Track when recipients click links in your emails
- **Real-time Dashboard**: View tracking statistics in a beautiful web dashboard
- **Auto-tracking**: Automatically track all outgoing emails
- **Privacy-focused**: All tracking data is stored on your own backend server

## Installation

### 1. Install the Backend Service

First, you need to run the backend tracking service:

```bash
cd email-tracker
npm install
npm start
```

The backend will run on `http://localhost:3000` by default.

### 2. Load the Chrome Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `gmail-tracker-extension` folder
5. The extension icon should appear in your Chrome toolbar

### 3. Configure the Extension

1. Click the extension icon in your Chrome toolbar
2. Enter your backend server URL (default: `http://localhost:3000`)
3. Enter your Gmail address
4. Click "Save Settings"

## Usage

### Sending Tracked Emails

1. Open Gmail and compose a new email
2. Write your email as usual
3. When auto-tracking is enabled, you'll see a "📧 Tracking enabled" indicator
4. Click Send - the email will automatically include tracking

### Viewing Tracking Data

1. Click the extension icon and click "Open Dashboard"
2. Or visit `http://localhost:3000` directly in your browser
3. View all tracked emails with open and click statistics
4. Click "View Detailed Logs" on any email to see detailed tracking information

## How It Works

### Email Open Tracking

The extension embeds a tiny 1x1 transparent tracking pixel image in your emails. When the recipient opens the email and loads images, their email client requests the pixel from the backend server, which logs the open event.

### Link Click Tracking

All links in your emails are automatically wrapped with tracking URLs. When a recipient clicks a link, they are briefly redirected through the backend server (which logs the click) before being forwarded to the original destination.

### Privacy Considerations

- **Gmail Image Proxy**: Gmail proxies all images through Google's servers, which means:
  - You won't see the recipient's real IP address (you'll see Google's proxy IP)
  - Gmail caches images, so you may only detect the first open reliably
  
- **Image Blocking**: Some email clients block images by default, which prevents tracking pixels from loading until the recipient explicitly enables images.

## Architecture

The system consists of two main components:

### 1. Chrome Extension
- Integrates with Gmail's interface
- Intercepts outgoing emails
- Injects tracking pixels and wraps links
- Provides popup interface for configuration

### 2. Backend Service (Node.js + Express)
- Serves tracking pixels
- Logs open and click events
- Provides REST API for tracking data
- Hosts web dashboard for viewing statistics

## API Endpoints

### Create Tracking Pixel
```
POST /api/pixels/create
Body: {
  "email_subject": "Hello",
  "recipient_email": "recipient@example.com",
  "user_id": "sender@gmail.com",
  "links": ["https://example.com"]
}
```

### Get User's Tracked Emails
```
GET /api/pixels/:user_id
```

### Get Tracking Statistics
```
GET /api/pixels/:pixel_id/stats
```

### Tracking Pixel Endpoint
```
GET /tracker/:pixel_id.png
```

### Link Click Tracking
```
GET /click/:link_id?redirect=<original_url>
```

## Development

### Extension Structure
```
gmail-tracker-extension/
├── manifest.json           # Extension manifest
├── popup.html             # Extension popup UI
├── popup.js               # Popup logic
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── scripts/
    ├── background.js      # Background service worker
    ├── content.js         # Content script (runs on Gmail)
    └── gmail-integration.js # Page context script
```

### Backend Structure
```
email-tracker/
├── app.js                 # Main Express server
├── database.js            # SQLite database setup
├── package.json           # Node.js dependencies
├── public/
│   └── images/
│       └── pixel.png      # 1x1 tracking pixel
└── views/
    ├── index.ejs          # Dashboard template
    └── logs.ejs           # Detailed logs template
```

## Limitations

1. **Gmail Image Caching**: Gmail caches images, so subsequent opens may not be detected
2. **IP Address Masking**: Gmail's image proxy masks recipient IP addresses
3. **Image Blocking**: Recipients who block images won't be tracked until they enable images
4. **Local Backend**: The default setup uses localhost, which only works on your machine

## Deployment

To make the tracking service accessible from anywhere:

1. Deploy the backend service to a cloud platform (see deployment instructions)
2. Update the extension settings with your deployed backend URL
3. Ensure your backend URL is publicly accessible via HTTPS

## Security

- All tracking data is stored on your own backend server
- No third-party services have access to your tracking data
- The extension only tracks emails you send, not emails you receive
- Authentication can be added to the backend API for additional security

## License

ISC

## Credits

Built with Node.js, Express, SQLite, and Chrome Extensions API.
