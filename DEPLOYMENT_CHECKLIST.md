# 📋 VGCMail Deployment Checklist

Use this checklist to ensure you complete all deployment steps correctly.

---

## Pre-Deployment

### Accounts & Services
- [ ] DigitalOcean account created
- [ ] Domain registered (vgcmail.app)
- [ ] Supabase project created
- [ ] Stripe account set up
- [ ] GitHub repository access confirmed

### Supabase Setup
- [ ] Database schema deployed (run `supabase-schema.sql`)
- [ ] Supabase URL noted
- [ ] Supabase Service Role Key noted
- [ ] Supabase Anon Key noted
- [ ] Email authentication enabled

### Stripe Setup
- [ ] Products created (Pro & Business)
- [ ] Price IDs noted
- [ ] Publishable key noted
- [ ] Secret key noted
- [ ] Test mode verified

---

## DigitalOcean Droplet Setup

### Initial Setup
- [ ] Droplet created (Ubuntu 22.04, 2GB RAM minimum)
- [ ] Droplet IP address noted
- [ ] SSH access confirmed
- [ ] System updated (`apt update && apt upgrade`)
- [ ] Non-root user created (`vgcmail`)
- [ ] Firewall configured (UFW)

### DNS Configuration
- [ ] A record for @ pointing to droplet IP
- [ ] A record for www pointing to droplet IP
- [ ] A record for api pointing to droplet IP
- [ ] DNS propagation verified (can take 5-60 minutes)

### Software Installation
- [ ] Node.js 22.x installed
- [ ] pnpm installed globally
- [ ] PM2 installed globally
- [ ] Nginx installed
- [ ] Certbot installed

---

## Application Deployment

### Repository Setup
- [ ] Repository cloned to `~/gmail-email-tracker`
- [ ] Backend dependencies installed (`npm install`)
- [ ] Frontend dependencies installed (`pnpm install`)

### Backend Configuration
- [ ] `backend/.env` file created
- [ ] PORT set to 3001
- [ ] SUPABASE_URL configured
- [ ] SUPABASE_SERVICE_KEY configured
- [ ] STRIPE_SECRET_KEY configured
- [ ] STRIPE_WEBHOOK_SECRET configured (placeholder initially)
- [ ] STRIPE_PRICE_PRO configured
- [ ] STRIPE_PRICE_BUSINESS configured
- [ ] FRONTEND_URL set to https://vgcmail.app

### Frontend Configuration
- [ ] `frontend/.env` file created
- [ ] VITE_API_URL set to https://api.vgcmail.app
- [ ] VITE_SUPABASE_URL configured
- [ ] VITE_SUPABASE_ANON_KEY configured
- [ ] VITE_STRIPE_PUBLISHABLE_KEY configured

### Build & Start
- [ ] Frontend built (`pnpm run build`)
- [ ] Backend started with PM2 (`pm2 start server.js --name vgcmail-api`)
- [ ] PM2 startup configured
- [ ] PM2 saved
- [ ] Backend health check verified (`curl http://localhost:3001/health`)

---

## Nginx Configuration

### Configuration Files
- [ ] Nginx config created (`/etc/nginx/sites-available/vgcmail`)
- [ ] Frontend configuration added (vgcmail.app, www.vgcmail.app)
- [ ] Backend proxy configuration added (api.vgcmail.app)
- [ ] Rate limiting configured
- [ ] Security headers added
- [ ] Gzip compression enabled
- [ ] Static asset caching configured

### Activation
- [ ] Symlink created (`/etc/nginx/sites-enabled/vgcmail`)
- [ ] Nginx configuration tested (`sudo nginx -t`)
- [ ] Nginx restarted

---

## SSL Certificates

### Certbot Setup
- [ ] SSL certificates obtained for all domains
- [ ] HTTP to HTTPS redirect enabled
- [ ] Certificate auto-renewal tested (`sudo certbot renew --dry-run`)

### Verification
- [ ] https://vgcmail.app loads correctly
- [ ] https://www.vgcmail.app loads correctly
- [ ] https://api.vgcmail.app/health returns JSON
- [ ] No SSL warnings in browser

---

## Stripe Integration

### Webhook Configuration
- [ ] Webhook endpoint added in Stripe Dashboard
- [ ] Endpoint URL: https://api.vgcmail.app/api/webhooks/stripe
- [ ] Events configured:
  - [ ] checkout.session.completed
  - [ ] customer.subscription.updated
  - [ ] customer.subscription.deleted
  - [ ] invoice.payment_failed
- [ ] Webhook signing secret copied
- [ ] Backend .env updated with webhook secret
- [ ] Backend restarted (`pm2 restart vgcmail-api`)
- [ ] Test webhook sent and verified

---

## Supabase Configuration

### URL Configuration
- [ ] Site URL updated to https://vgcmail.app
- [ ] Redirect URLs added:
  - [ ] https://vgcmail.app/dashboard
  - [ ] https://vgcmail.app/login
  - [ ] https://vgcmail.app/signup
  - [ ] https://www.vgcmail.app/dashboard
  - [ ] https://www.vgcmail.app/login
  - [ ] https://www.vgcmail.app/signup
- [ ] Configuration saved

---

## Testing

### Frontend Testing
- [ ] Landing page loads (https://vgcmail.app)
- [ ] Pricing page loads
- [ ] Navigation works
- [ ] Responsive design verified (mobile/tablet/desktop)
- [ ] No console errors

### Authentication Testing
- [ ] Signup page loads
- [ ] Can create new account
- [ ] Email confirmation works (if enabled)
- [ ] Login works
- [ ] Logout works
- [ ] Dashboard accessible after login

### Stripe Checkout Testing
- [ ] Can click "Start Pro Trial" on pricing page
- [ ] Redirects to Stripe checkout
- [ ] Test card works (4242 4242 4242 4242)
- [ ] Redirects back to dashboard after payment
- [ ] Subscription appears in Stripe Dashboard
- [ ] User subscription_tier updated in Supabase

### API Testing
- [ ] Health endpoint works (`curl https://api.vgcmail.app/health`)
- [ ] CORS configured correctly
- [ ] Rate limiting works
- [ ] Webhook endpoint accessible

### Email Tracking Testing
- [ ] Can create tracked email via API
- [ ] Tracking pixel loads
- [ ] Email opens recorded in database
- [ ] Link tracking works
- [ ] Link clicks recorded in database

---

## Monitoring & Maintenance

### Monitoring Setup
- [ ] PM2 monitoring verified (`pm2 monit`)
- [ ] Nginx logs accessible
- [ ] Backend logs accessible (`pm2 logs vgcmail-api`)
- [ ] Disk space checked (`df -h`)
- [ ] Memory usage checked (`free -h`)

### Security
- [ ] Automatic security updates enabled
- [ ] Fail2Ban installed (optional)
- [ ] Backup strategy planned
- [ ] Environment variables secured

---

## Post-Deployment

### Documentation
- [ ] Deployment documented
- [ ] Environment variables documented
- [ ] Team members informed

### Marketing
- [ ] Social media announcement prepared
- [ ] Product Hunt launch planned
- [ ] Email list notified (if applicable)

### Chrome Extension (Phase 6 - Future)
- [ ] Extension updated with production API URL
- [ ] Extension tested
- [ ] Extension published to Chrome Web Store

---

## Troubleshooting Completed

If you encountered issues, document what you fixed:

- [ ] Issue: _______________
  - Solution: _______________

- [ ] Issue: _______________
  - Solution: _______________

---

## Final Verification

### All Systems Go
- [ ] Frontend: https://vgcmail.app ✅
- [ ] API: https://api.vgcmail.app ✅
- [ ] Dashboard: https://vgcmail.app/dashboard ✅
- [ ] Stripe checkout working ✅
- [ ] Email tracking working ✅
- [ ] SSL certificates valid ✅
- [ ] Monitoring active ✅

---

## 🎉 Deployment Complete!

**Date Deployed:** _______________  
**Deployed By:** _______________  
**Droplet IP:** _______________  
**Notes:** _______________

---

## Quick Reference

**SSH Access:**
```bash
ssh vgcmail@YOUR_DROPLET_IP
```

**View Logs:**
```bash
pm2 logs vgcmail-api
sudo tail -f /var/log/nginx/error.log
```

**Restart Services:**
```bash
pm2 restart vgcmail-api
sudo systemctl restart nginx
```

**Update Application:**
```bash
cd ~/gmail-email-tracker
git pull origin main
cd backend && npm install && pm2 restart vgcmail-api
cd ../frontend && pnpm install && pnpm run build
```

---

**Need Help?** See DIGITALOCEAN_DEPLOYMENT.md for detailed instructions.
