# 🚀 DigitalOcean Droplet Deployment Guide

Complete step-by-step guide to deploy VGCMail on a DigitalOcean Droplet with your custom domain (vgcmail.app).

---

## 📋 Prerequisites

- ✅ DigitalOcean account
- ✅ Domain registered (vgcmail.app)
- ✅ GitHub repository access
- ✅ Supabase project set up
- ✅ Stripe account configured

---

## 🖥️ Step 1: Create DigitalOcean Droplet

### 1.1 Create Droplet

1. Log in to [DigitalOcean](https://cloud.digitalocean.com)
2. Click **"Create"** → **"Droplets"**
3. **Choose Configuration:**
   - **Image:** Ubuntu 22.04 LTS x64
   - **Plan:** Basic
   - **CPU Options:** Regular (Shared CPU)
   - **Size:** $12/month (2 GB RAM, 1 vCPU, 50 GB SSD) - Recommended minimum
   - **Datacenter:** Choose closest to your users
   - **Authentication:** SSH keys (recommended) or Password
   - **Hostname:** vgcmail-production

4. Click **"Create Droplet"**
5. Wait 1-2 minutes for droplet to be created
6. **Note your droplet's IP address** (e.g., 164.90.xxx.xxx)

---

## 🌐 Step 2: Configure Domain DNS

### 2.1 Add DNS Records

Go to your domain registrar (GoDaddy, Namecheap, etc.) and add these DNS records:

```
Type: A
Name: @
Value: YOUR_DROPLET_IP
TTL: 3600

Type: A
Name: www
Value: YOUR_DROPLET_IP
TTL: 3600

Type: A
Name: api
Value: YOUR_DROPLET_IP
TTL: 3600
```

**Example:**
```
A    @      164.90.xxx.xxx
A    www    164.90.xxx.xxx
A    api    164.90.xxx.xxx
```

**Note:** DNS propagation can take 5-60 minutes.

---

## 🔐 Step 3: Initial Server Setup

### 3.1 Connect to Your Droplet

```bash
ssh root@YOUR_DROPLET_IP
```

### 3.2 Update System

```bash
apt update && apt upgrade -y
```

### 3.3 Create Non-Root User

```bash
adduser vgcmail
usermod -aG sudo vgcmail
```

Set a strong password when prompted.

### 3.4 Configure Firewall

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

Type `y` when prompted.

### 3.5 Switch to New User

```bash
su - vgcmail
```

---

## 📦 Step 4: Install Required Software

### 4.1 Install Node.js 22.x

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify installation:
```bash
node --version  # Should show v22.x.x
npm --version   # Should show 10.x.x
```

### 4.2 Install pnpm

```bash
sudo npm install -g pnpm
```

### 4.3 Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

### 4.4 Install Nginx

```bash
sudo apt install -y nginx
```

### 4.5 Install Certbot (for SSL)

```bash
sudo apt install -y certbot python3-certbot-nginx
```

---

## 📥 Step 5: Clone and Setup Application

### 5.1 Clone Repository

```bash
cd ~
git clone https://github.com/VanceGC/gmail-email-tracker.git
cd gmail-email-tracker
```

### 5.2 Setup Backend

```bash
cd backend
npm install
```

Create `.env` file:
```bash
nano .env
```

Add the following (replace with your actual values):
```env
PORT=3001
SUPABASE_URL=https://rsrmzsqfxwltwptgvpiz.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_webhook_secret_here
STRIPE_PRICE_PRO=price_1SFHqPKdqvrj50kO9o4pTyKq
STRIPE_PRICE_BUSINESS=price_1SFHqbKdqvrj50kOoPhNdiYT
FRONTEND_URL=https://vgcmail.app
```

Save and exit (Ctrl+X, Y, Enter)

### 5.3 Setup Frontend

```bash
cd ~/gmail-email-tracker/frontend
pnpm install
```

Create `.env` file:
```bash
nano .env
```

Add the following:
```env
VITE_API_URL=https://api.vgcmail.app
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
```

Save and exit (Ctrl+X, Y, Enter)

### 5.4 Build Frontend

```bash
pnpm run build
```

This creates a `dist` folder with production-ready files.

---

## 🔄 Step 6: Start Backend with PM2

### 6.1 Start Backend

```bash
cd ~/gmail-email-tracker/backend
pm2 start server.js --name vgcmail-api
```

### 6.2 Configure PM2 to Start on Boot

```bash
pm2 startup
```

Copy and run the command it outputs (starts with `sudo env PATH=...`)

```bash
pm2 save
```

### 6.3 Verify Backend is Running

```bash
pm2 status
curl http://localhost:3001/health
```

Should return: `{"status":"ok","message":"VGCMail API is running"}`

---

## 🌐 Step 7: Configure Nginx

### 7.1 Create Nginx Configuration for Frontend

```bash
sudo nano /etc/nginx/sites-available/vgcmail
```

Add the following configuration:

```nginx
# Frontend - vgcmail.app
server {
    listen 80;
    listen [::]:80;
    server_name vgcmail.app www.vgcmail.app;

    root /home/vgcmail/gmail-email-tracker/frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Handle React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Backend API - api.vgcmail.app
server {
    listen 80;
    listen [::]:80;
    server_name api.vgcmail.app;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Special handling for Stripe webhooks (no rate limit)
    location /api/webhooks/stripe {
        limit_req off;
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Save and exit (Ctrl+X, Y, Enter)

### 7.2 Enable the Configuration

```bash
sudo ln -s /etc/nginx/sites-available/vgcmail /etc/nginx/sites-enabled/
```

### 7.3 Test Nginx Configuration

```bash
sudo nginx -t
```

Should show: "syntax is ok" and "test is successful"

### 7.4 Restart Nginx

```bash
sudo systemctl restart nginx
```

---

## 🔒 Step 8: Setup SSL Certificates (HTTPS)

### 8.1 Obtain SSL Certificates

```bash
sudo certbot --nginx -d vgcmail.app -d www.vgcmail.app -d api.vgcmail.app
```

Follow the prompts:
1. Enter your email address
2. Agree to terms of service (Y)
3. Share email with EFF (optional - Y or N)
4. Choose option 2: Redirect HTTP to HTTPS

### 8.2 Verify SSL Auto-Renewal

```bash
sudo certbot renew --dry-run
```

Should show: "Congratulations, all simulated renewals succeeded"

### 8.3 Test Your Sites

Open in browser:
- https://vgcmail.app (should show landing page)
- https://api.vgcmail.app/health (should show API health check)

---

## 🔔 Step 9: Configure Stripe Webhooks

### 9.1 Update Stripe Webhook Endpoint

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click **"Add endpoint"**
3. **Endpoint URL:** `https://api.vgcmail.app/api/webhooks/stripe`
4. **Events to send:**
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Click **"Add endpoint"**
6. Copy the **Signing secret** (starts with `whsec_`)

### 9.2 Update Backend Environment Variable

```bash
nano ~/gmail-email-tracker/backend/.env
```

Update the line:
```env
STRIPE_WEBHOOK_SECRET=whsec_your_actual_signing_secret_here
```

Save and exit.

### 9.3 Restart Backend

```bash
pm2 restart vgcmail-api
```

### 9.4 Test Webhook

In Stripe Dashboard, click "Send test webhook" to verify it's working.

---

## ✅ Step 10: Update Supabase Configuration

### 10.1 Update Supabase Auth URLs

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/rsrmzsqfxwltwptgvpiz)
2. Click **"Authentication"** → **"URL Configuration"**
3. Update:
   - **Site URL:** `https://vgcmail.app`
   - **Redirect URLs:** Add these:
     - `https://vgcmail.app/dashboard`
     - `https://vgcmail.app/login`
     - `https://vgcmail.app/signup`
     - `https://www.vgcmail.app/dashboard`
     - `https://www.vgcmail.app/login`
     - `https://www.vgcmail.app/signup`
4. Click **"Save"**

---

## 🧪 Step 11: Test Your Application

### 11.1 Test Frontend
1. Visit https://vgcmail.app
2. Should see landing page
3. Click "Get Started" → Should go to signup
4. Click "Pricing" → Should show pricing page

### 11.2 Test Signup Flow
1. Go to https://vgcmail.app/signup
2. Create a new account
3. Check email for confirmation (if enabled)
4. Should redirect to dashboard

### 11.3 Test Stripe Checkout
1. Go to https://vgcmail.app/pricing
2. Click "Start Pro Trial"
3. Use test card: `4242 4242 4242 4242`
4. Complete checkout
5. Should redirect to dashboard
6. Check Stripe Dashboard for new subscription

### 11.4 Test API Health
```bash
curl https://api.vgcmail.app/health
```

Should return:
```json
{"status":"ok","message":"VGCMail API is running"}
```

---

## 📊 Step 12: Monitoring and Maintenance

### 12.1 View Backend Logs

```bash
pm2 logs vgcmail-api
```

### 12.2 View Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### 12.3 PM2 Monitoring

```bash
pm2 monit
```

### 12.4 Check Disk Space

```bash
df -h
```

### 12.5 Check Memory Usage

```bash
free -h
```

---

## 🔄 Step 13: Updating Your Application

### 13.1 Pull Latest Changes

```bash
cd ~/gmail-email-tracker
git pull origin main
```

### 13.2 Update Backend

```bash
cd backend
npm install
pm2 restart vgcmail-api
```

### 13.3 Update Frontend

```bash
cd ~/gmail-email-tracker/frontend
pnpm install
pnpm run build
```

No restart needed - Nginx serves the new static files immediately.

---

## 🔐 Step 14: Security Best Practices

### 14.1 Setup Automatic Security Updates

```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

Select "Yes"

### 14.2 Configure Fail2Ban (Optional but Recommended)

```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 14.3 Regular Backups

Setup automated backups of:
- `/home/vgcmail/gmail-email-tracker/` (application code)
- Supabase database (use Supabase's backup feature)

---

## 🚨 Troubleshooting

### Issue: Frontend shows 404 errors

**Solution:**
```bash
cd ~/gmail-email-tracker/frontend
pnpm run build
sudo systemctl restart nginx
```

### Issue: Backend not responding

**Solution:**
```bash
pm2 restart vgcmail-api
pm2 logs vgcmail-api
```

### Issue: SSL certificate errors

**Solution:**
```bash
sudo certbot renew
sudo systemctl restart nginx
```

### Issue: Can't connect to API

**Solution:**
```bash
# Check if backend is running
pm2 status

# Check Nginx configuration
sudo nginx -t

# Check firewall
sudo ufw status
```

### Issue: Stripe webhooks failing

**Solution:**
1. Check webhook signing secret in `.env`
2. Verify endpoint URL in Stripe Dashboard
3. Check backend logs: `pm2 logs vgcmail-api`

---

## 📈 Performance Optimization

### Enable HTTP/2

Already enabled with Certbot SSL configuration.

### Setup Redis Caching (Optional)

```bash
sudo apt install redis-server -y
sudo systemctl enable redis-server
```

Update backend to use Redis for session caching.

### Setup CDN (Optional)

Use Cloudflare or DigitalOcean Spaces CDN for static assets.

---

## 💰 Cost Breakdown

**DigitalOcean Droplet:**
- $12/month (2 GB RAM) - Recommended for production
- $24/month (4 GB RAM) - For higher traffic

**Additional Services:**
- Supabase: Free tier (upgrade as needed)
- Stripe: 2.9% + $0.30 per transaction
- Domain: ~$12/year

**Total Monthly Cost:** ~$12-24/month

---

## 📋 Quick Reference Commands

```bash
# View backend logs
pm2 logs vgcmail-api

# Restart backend
pm2 restart vgcmail-api

# Restart Nginx
sudo systemctl restart nginx

# Check backend status
pm2 status

# Test Nginx config
sudo nginx -t

# View Nginx logs
sudo tail -f /var/log/nginx/error.log

# Update application
cd ~/gmail-email-tracker && git pull
cd backend && npm install && pm2 restart vgcmail-api
cd ../frontend && pnpm install && pnpm run build

# Renew SSL certificates
sudo certbot renew
```

---

## ✅ Deployment Checklist

- [ ] DigitalOcean Droplet created
- [ ] DNS records configured
- [ ] Server updated and secured
- [ ] Node.js, pnpm, PM2, Nginx installed
- [ ] Application cloned from GitHub
- [ ] Backend `.env` configured
- [ ] Frontend `.env` configured
- [ ] Frontend built (`pnpm run build`)
- [ ] Backend started with PM2
- [ ] Nginx configured
- [ ] SSL certificates obtained
- [ ] Stripe webhooks configured
- [ ] Supabase URLs updated
- [ ] Application tested end-to-end
- [ ] Monitoring setup

---

## 🎉 Success!

Your VGCMail application is now live at:
- **Frontend:** https://vgcmail.app
- **API:** https://api.vgcmail.app
- **Dashboard:** https://vgcmail.app/dashboard

**Congratulations on deploying your SaaS application!** 🚀

---

## 📞 Need Help?

If you encounter any issues:
1. Check the troubleshooting section above
2. Review PM2 logs: `pm2 logs vgcmail-api`
3. Review Nginx logs: `sudo tail -f /var/log/nginx/error.log`
4. Check Supabase logs in the dashboard
5. Review Stripe webhook logs

**Support:** support@vgcmail.app
