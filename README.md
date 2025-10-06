# Gmail Email Tracker

A complete email tracking solution for Gmail that tracks email opens and link clicks, similar to Mailsuite and Mailtrack.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![Chrome](https://img.shields.io/badge/chrome-extension-yellow.svg)

## 🎯 Features

- **📧 Email Open Tracking** - Know exactly when recipients open your emails
- **🔗 Link Click Tracking** - Track which links get clicked and when
- **📊 Beautiful Dashboard** - View all tracking statistics in a modern web interface
- **🔔 Real-time Updates** - See opens and clicks as they happen
- **🎨 Chrome Extension** - Seamless integration with Gmail
- **🔒 Privacy-Focused** - All data stored on your own server
- **📱 Responsive Design** - Works on desktop, tablet, and mobile

## 🚀 Live Demo

**Dashboard:** [View Demo](https://3000-iy6nmzokkz7wmzz95h54r-4252293f.manusvm.computer/?user_id=demo@example.com)

## 📋 Table of Contents

- [How It Works](#how-it-works)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## 🔍 How It Works

### Email Open Tracking

The system embeds a tiny 1x1 transparent tracking pixel in your emails. When the recipient opens the email and their email client loads images, it requests the pixel from your backend server, which logs the open event.

```html
<img src="https://your-server.com/tracker/abc-123.png" width="1" height="1" style="display:none;" />
```

### Link Click Tracking

All links in your emails are automatically wrapped with tracking URLs that redirect through your backend server:

```
Original: https://example.com
Tracked:  https://your-server.com/click/xyz-789?redirect=https://example.com
```

When clicked, the backend logs the event and immediately redirects to the original destination.

## 📦 Installation

### Prerequisites

- Node.js 18+ and npm
- Google Chrome browser
- A server to host the backend (for production)

### Backend Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/VanceGC/gmail-email-tracker.git
   cd gmail-email-tracker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

   The server will run on `http://localhost:3000` by default.

4. **Access the dashboard:**
   ```
   http://localhost:3000/?user_id=your.email@gmail.com
   ```

### Chrome Extension Setup

1. **Open Chrome Extensions:**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)

2. **Load the extension:**
   - Click "Load unpacked"
   - Select the `extension` folder from this repository

3. **Configure the extension:**
   - Click the extension icon (📧) in your toolbar
   - Enter your backend URL (e.g., `http://localhost:3000`)
   - Enter your Gmail address
   - Click "Save Settings"

## ⚙️ Configuration

### Backend Configuration

Edit environment variables or modify `app.js`:

```javascript
const PORT = process.env.PORT || 3000;
```

### Extension Configuration

Configure through the extension popup:
- **Backend Server URL** - Your backend server address
- **Gmail Address** - Your email address for tracking
- **Auto-track** - Enable/disable automatic tracking

## 📖 Usage

### Sending Tracked Emails

1. Open Gmail and compose a new email
2. Write your email normally
3. When auto-tracking is enabled, you'll see "📧 Tracking enabled"
4. Click Send - tracking is automatic!

### Viewing Tracking Data

**Dashboard:**
- Visit your backend URL in a browser
- View all tracked emails with statistics
- Click "View Detailed Logs" for individual email details

**Extension Popup:**
- Click the extension icon
- See quick stats (total tracked, total opens)
- Click "Open Dashboard" for full view

### API Usage

Create tracking pixels programmatically:

```bash
curl -X POST http://localhost:3000/api/pixels/create \
  -H "Content-Type: application/json" \
  -d '{
    "email_subject": "Hello World",
    "recipient_email": "recipient@example.com",
    "user_id": "sender@gmail.com",
    "links": ["https://example.com"]
  }'
```

## 📚 API Documentation

### Endpoints

#### Create Tracking Pixel
```
POST /api/pixels/create
```

**Request Body:**
```json
{
  "email_subject": "string",
  "recipient_email": "string",
  "user_id": "string",
  "links": ["string"]
}
```

**Response:**
```json
{
  "pixel_id": "uuid",
  "tracking_url": "string",
  "wrapped_links": {
    "original_url": "tracking_url"
  }
}
```

#### Get User's Tracked Emails
```
GET /api/pixels/:user_id
```

**Response:**
```json
{
  "pixels": [
    {
      "id": "uuid",
      "email_subject": "string",
      "recipient_email": "string",
      "open_count": 0,
      "click_count": 0,
      "created_at": "timestamp"
    }
  ]
}
```

#### Get Tracking Statistics
```
GET /api/pixels/:pixel_id/stats
```

**Response:**
```json
{
  "opens": [...],
  "clicks": [...],
  "total_opens": 0,
  "total_clicks": 0
}
```

#### Tracking Pixel Endpoint
```
GET /tracker/:pixel_id.png
```
Returns a 1x1 transparent PNG and logs the open event.

#### Link Click Tracking
```
GET /click/:link_id?redirect=<url>
```
Logs the click event and redirects to the original URL.

## 🌐 Deployment

### Deploy to Your Server

1. **Copy files to your server:**
   ```bash
   scp -r gmail-email-tracker user@your-server.com:/var/www/
   ```

2. **Install dependencies:**
   ```bash
   cd /var/www/gmail-email-tracker
   npm install --production
   ```

3. **Set up process manager (PM2):**
   ```bash
   npm install -g pm2
   pm2 start app.js --name gmail-tracker
   pm2 save
   pm2 startup
   ```

4. **Configure reverse proxy (nginx):**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

5. **Set up SSL with Let's Encrypt:**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

### Deploy to Cloud Platforms

#### Heroku
```bash
heroku create your-app-name
git push heroku main
```

#### Railway
```bash
railway login
railway init
railway up
```

#### DigitalOcean App Platform
- Connect your GitHub repository
- Select Node.js environment
- Deploy automatically

## 🛠️ Development

### Project Structure

```
gmail-email-tracker/
├── app.js                 # Main Express server
├── database.js            # SQLite database setup
├── package.json           # Node.js dependencies
├── public/
│   └── images/
│       └── pixel.png      # 1x1 tracking pixel
├── views/
│   ├── index.ejs          # Dashboard template
│   └── logs.ejs           # Detailed logs template
└── extension/
    ├── manifest.json      # Extension manifest
    ├── popup.html         # Extension popup
    ├── popup.js           # Popup logic
    ├── icons/             # Extension icons
    └── scripts/
        ├── background.js  # Background service worker
        ├── content.js     # Content script
        └── gmail-integration.js  # Gmail integration
```

### Running in Development

```bash
# Install dependencies
npm install

# Start server with auto-reload
npm run dev

# Or start normally
npm start
```

### Database Schema

**Pixels Table:**
```sql
CREATE TABLE pixels (
  id TEXT PRIMARY KEY,
  email_subject TEXT,
  recipient_email TEXT,
  user_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Opens Table:**
```sql
CREATE TABLE opens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pixel_id TEXT,
  opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  user_agent TEXT,
  FOREIGN KEY (pixel_id) REFERENCES pixels(id)
);
```

**Links Table:**
```sql
CREATE TABLE links (
  id TEXT PRIMARY KEY,
  pixel_id TEXT,
  original_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pixel_id) REFERENCES pixels(id)
);
```

**Clicks Table:**
```sql
CREATE TABLE clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  link_id TEXT,
  clicked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  user_agent TEXT,
  FOREIGN KEY (link_id) REFERENCES links(id)
);
```

## ⚠️ Known Limitations

### Gmail Image Proxy
- Gmail proxies images through Google's servers
- You'll see Google's proxy IP instead of recipient's real IP
- Gmail caches images, so subsequent opens may not be detected
- This is a limitation of all email tracking systems

### Image Blocking
- Some email clients block images by default
- Tracking won't work until recipient enables images
- No workaround available

### Privacy Considerations
- Recipients can detect tracking pixels by inspecting email HTML
- Always comply with privacy laws (GDPR, CAN-SPAM, etc.)
- Consider adding tracking disclosure to email footers

## 🔒 Security

### Current Implementation
- CORS enabled for extension access
- SQLite database with local storage
- No authentication required (development mode)

### Production Recommendations
- Add API key authentication
- Implement rate limiting
- Use HTTPS with SSL certificate
- Add user authentication for dashboard
- Implement data encryption
- Add GDPR compliance features

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [Mailsuite](https://mailsuite.com/) and [Mailtrack](https://mailtrack.io/)
- Built with [Express](https://expressjs.com/), [SQLite](https://www.sqlite.org/), and [Chrome Extensions API](https://developer.chrome.com/docs/extensions/)

## 📞 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check the [Installation Guide](INSTALLATION_GUIDE.md)
- Review the [Project Summary](PROJECT_SUMMARY.md)

## 🎯 Roadmap

- [ ] Real-time WebSocket notifications
- [ ] User authentication system
- [ ] Group email tracking
- [ ] Email campaigns feature
- [ ] Mail merge functionality
- [ ] Advanced analytics dashboard
- [ ] Mobile app (iOS/Android)
- [ ] Outlook integration
- [ ] CRM integrations (Salesforce, HubSpot)

---

Made with ❤️ for better email tracking

**Star ⭐ this repo if you find it useful!**
