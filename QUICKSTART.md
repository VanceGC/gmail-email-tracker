# Quick Start Guide - Server Installation

This guide will help you quickly deploy the Gmail Email Tracker to your server.

## 🚀 One-Command Installation

SSH into your server and run:

```bash
# Clone and setup
git clone https://github.com/VanceGC/gmail-email-tracker.git
cd gmail-email-tracker
npm install
npm start
```

That's it! The server is now running on port 3000.

## 📋 Step-by-Step Installation

### 1. Prerequisites

Make sure you have Node.js installed:

```bash
node --version  # Should be 18+
npm --version
```

If not installed:

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
```

### 2. Clone Repository

```bash
git clone https://github.com/VanceGC/gmail-email-tracker.git
cd gmail-email-tracker
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Server

```bash
npm start
```

The server will start on `http://localhost:3000`

### 5. Test It Works

Open another terminal and test:

```bash
curl http://localhost:3000
```

You should see HTML output from the dashboard.

## 🔧 Production Setup

### Keep Server Running (PM2)

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start app.js --name gmail-tracker

# Save configuration
pm2 save

# Auto-start on reboot
pm2 startup
```

### Set Up Domain Access

If you have a domain name, set up Nginx:

```bash
# Install Nginx
sudo apt install nginx -y

# Create configuration
sudo nano /etc/nginx/sites-available/gmail-tracker
```

Add this configuration (replace `your-domain.com`):

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

Enable and restart:

```bash
sudo ln -s /etc/nginx/sites-available/gmail-tracker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Add SSL Certificate

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
```

## 🌐 Access Your Tracker

### Local Access
```
http://localhost:3000
```

### Domain Access
```
https://your-domain.com
```

### Dashboard
```
https://your-domain.com/?user_id=your.email@gmail.com
```

## 🔌 Configure Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension` folder from the repository
5. Click the extension icon and configure:
   - **Backend URL**: `https://your-domain.com` (or `http://your-server-ip:3000`)
   - **Gmail Address**: Your email address
6. Click "Save Settings"

## ✅ Test Email Tracking

1. Open Gmail
2. Compose a new email
3. You should see "📧 Tracking enabled"
4. Send the email to yourself
5. Open the email
6. Check the dashboard - you should see the open was tracked!

## 🛠️ Common Commands

```bash
# View logs
pm2 logs gmail-tracker

# Restart server
pm2 restart gmail-tracker

# Stop server
pm2 stop gmail-tracker

# Check status
pm2 status

# Update code
cd ~/gmail-email-tracker
git pull
npm install
pm2 restart gmail-tracker
```

## 🔥 Firewall Configuration

If you can't access the server, open the firewall:

```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000
sudo ufw enable

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

## 📊 Monitoring

### Check if server is running

```bash
pm2 status
```

### View real-time logs

```bash
pm2 logs gmail-tracker --lines 100
```

### Monitor resources

```bash
pm2 monit
```

## 🆘 Troubleshooting

### Port already in use

```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>
```

### Permission denied

```bash
# Fix permissions
sudo chown -R $USER:$USER ~/gmail-email-tracker
```

### Can't access from outside

1. Check firewall is open
2. Check Nginx is running: `sudo systemctl status nginx`
3. Check server is running: `pm2 status`
4. Check server IP/domain is correct

### Database errors

```bash
# Remove old database and restart
cd ~/gmail-email-tracker
rm -f email-tracker.db
pm2 restart gmail-tracker
```

## 📚 Next Steps

- Read [DEPLOYMENT.md](DEPLOYMENT.md) for advanced configuration
- Read [README.md](README.md) for full documentation
- Check [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md) for detailed setup

## 💡 Tips

1. **Use HTTPS** - Always use SSL in production
2. **Backup Database** - Regularly backup `email-tracker.db`
3. **Monitor Logs** - Check logs regularly for issues
4. **Update Regularly** - Pull latest updates from GitHub
5. **Secure API** - Add authentication for production use

## 🎉 You're Done!

Your Gmail Email Tracker is now running on your server!

**Repository**: https://github.com/VanceGC/gmail-email-tracker

**Need Help?** Open an issue on GitHub or check the documentation.

---

Made with ❤️ for better email tracking
