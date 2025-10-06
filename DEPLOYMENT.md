# Deployment Guide

This guide will help you deploy the Gmail Email Tracker to your own server.

## Prerequisites

- A server with SSH access (VPS, dedicated server, etc.)
- Node.js 18+ installed
- Domain name (optional but recommended)
- Basic knowledge of Linux command line

## Quick Deployment

### 1. Clone Repository on Your Server

```bash
# SSH into your server
ssh user@your-server.com

# Clone the repository
git clone https://github.com/VanceGC/gmail-email-tracker.git
cd gmail-email-tracker

# Install dependencies
npm install --production
```

### 2. Test the Application

```bash
# Start the server
npm start

# Test in another terminal
curl http://localhost:3000
```

If you see HTML output, the server is working!

### 3. Set Up Process Manager (PM2)

PM2 keeps your application running and restarts it if it crashes.

```bash
# Install PM2 globally
npm install -g pm2

# Start the application with PM2
pm2 start app.js --name gmail-tracker

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
# Follow the instructions shown
```

### 4. Configure Firewall

```bash
# Allow HTTP and HTTPS traffic
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000  # For direct access (optional)
sudo ufw enable
```

### 5. Set Up Reverse Proxy (Nginx)

#### Install Nginx

```bash
sudo apt update
sudo apt install nginx -y
```

#### Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/gmail-tracker
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Enable the Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/gmail-tracker /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 6. Set Up SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Certificate will auto-renew
```

### 7. Update Chrome Extension

1. Open the extension popup
2. Update Backend Server URL to: `https://your-domain.com`
3. Click "Save Settings"

## Environment Variables

Create a `.env` file for configuration:

```bash
nano .env
```

Add:

```env
PORT=3000
NODE_ENV=production
```

Update `app.js` to use environment variables:

```javascript
require('dotenv').config();
const PORT = process.env.PORT || 3000;
```

Install dotenv:

```bash
npm install dotenv
```

## Monitoring

### View Application Logs

```bash
# PM2 logs
pm2 logs gmail-tracker

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Check Application Status

```bash
# PM2 status
pm2 status

# PM2 monitoring
pm2 monit
```

### Restart Application

```bash
# Restart with PM2
pm2 restart gmail-tracker

# Reload Nginx
sudo systemctl reload nginx
```

## Updating the Application

```bash
# Pull latest changes
cd ~/gmail-email-tracker
git pull origin main

# Install new dependencies
npm install --production

# Restart application
pm2 restart gmail-tracker
```

## Backup

### Backup Database

```bash
# Create backup directory
mkdir -p ~/backups

# Backup database
cp ~/gmail-email-tracker/email-tracker.db ~/backups/email-tracker-$(date +%Y%m%d).db

# Automated daily backup (add to crontab)
crontab -e
# Add this line:
# 0 2 * * * cp ~/gmail-email-tracker/email-tracker.db ~/backups/email-tracker-$(date +\%Y\%m\%d).db
```

## Security Hardening

### 1. Add API Authentication

Create middleware in `app.js`:

```javascript
const API_KEY = process.env.API_KEY || 'your-secret-key';

function authenticateAPI(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (apiKey && apiKey === API_KEY) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// Apply to API routes
app.post('/api/pixels/create', authenticateAPI, (req, res) => {
  // ... existing code
});
```

### 2. Rate Limiting

```bash
npm install express-rate-limit
```

Add to `app.js`:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 3. Helmet for Security Headers

```bash
npm install helmet
```

Add to `app.js`:

```javascript
const helmet = require('helmet');
app.use(helmet());
```

## Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs gmail-tracker

# Check if port is in use
sudo lsof -i :3000

# Check Node.js version
node --version  # Should be 18+
```

### Nginx Configuration Issues

```bash
# Test configuration
sudo nginx -t

# Check Nginx status
sudo systemctl status nginx

# View error logs
sudo tail -f /var/log/nginx/error.log
```

### SSL Certificate Issues

```bash
# Test certificate renewal
sudo certbot renew --dry-run

# Force renewal
sudo certbot renew --force-renewal
```

### Database Issues

```bash
# Check database file permissions
ls -la email-tracker.db

# Fix permissions if needed
chmod 644 email-tracker.db
```

## Performance Optimization

### 1. Enable Gzip Compression

Add to Nginx configuration:

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
```

### 2. Add Caching Headers

Add to Nginx configuration:

```nginx
location /public/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. Use PM2 Cluster Mode

```bash
pm2 start app.js --name gmail-tracker -i max
```

## Scaling

### Horizontal Scaling

For high traffic, consider:

1. **Load Balancer** - Distribute traffic across multiple servers
2. **Database Migration** - Move from SQLite to PostgreSQL/MySQL
3. **Redis Cache** - Cache tracking data for faster access
4. **CDN** - Serve static assets from CDN

### Database Migration

To migrate from SQLite to PostgreSQL:

1. Install PostgreSQL
2. Update database.js to use `pg` package
3. Migrate existing data
4. Update connection strings

## Cloud Platform Deployment

### Heroku

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Create app
heroku create your-app-name

# Deploy
git push heroku main

# Open app
heroku open
```

### DigitalOcean App Platform

1. Connect GitHub repository
2. Select Node.js environment
3. Set build command: `npm install`
4. Set run command: `npm start`
5. Deploy

### Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize
railway init

# Deploy
railway up
```

## Cost Estimation

### Basic VPS Setup
- **DigitalOcean Droplet**: $6/month (1GB RAM)
- **Domain Name**: $10-15/year
- **SSL Certificate**: Free (Let's Encrypt)

**Total**: ~$7-8/month

### Cloud Platform
- **Heroku**: $7/month (Hobby tier)
- **Railway**: $5/month (Starter tier)
- **DigitalOcean App**: $5/month (Basic tier)

## Support

If you encounter issues:

1. Check the logs: `pm2 logs gmail-tracker`
2. Review Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Test locally: `npm start`
4. Open an issue on GitHub

## Next Steps

After deployment:

1. ✅ Test email tracking with real emails
2. ✅ Set up automated backups
3. ✅ Configure monitoring (optional)
4. ✅ Add custom domain
5. ✅ Enable SSL
6. ✅ Update Chrome extension with new URL

Your Gmail Email Tracker is now live! 🎉
