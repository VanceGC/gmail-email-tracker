# VGCMail Deployment Guide

This guide will help you deploy VGCMail to production for vgcmail.app.

---

## 📋 Prerequisites

- ✅ Supabase project set up
- ✅ Stripe account with products created
- ✅ Domain registered (vgcmail.app)
- ✅ GitHub repository
- ⏳ Hosting accounts (Vercel/Railway/Render)

---

## 🗄️ Step 1: Database (Already Done!)

Your Supabase database is already set up with:
- Schema deployed
- RLS policies active
- Authentication enabled

**Supabase URL:** https://rsrmzsqfxwltwptgvpiz.supabase.co

---

## 💳 Step 2: Stripe Configuration

### Products Created:
- ✅ VGCMail Pro ($9.99/month)
- ✅ VGCMail Business ($29.99/month)

### Next Steps:
1. Get your Stripe publishable key
2. Configure webhook endpoint (after backend deployment)
3. Test with Stripe test cards

**Test Cards:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

---

## 🚀 Step 3: Deploy Backend API

### Option A: Railway (Recommended)

1. **Install Railway CLI:**
```bash
npm install -g @railway/cli
railway login
```

2. **Deploy:**
```bash
cd /home/ubuntu/vgcmail-app/backend
railway init
railway up
```

3. **Set Environment Variables:**
```bash
railway variables set PORT=3001
railway variables set SUPABASE_URL=https://rsrmzsqfxwltwptgvpiz.supabase.co
railway variables set SUPABASE_SERVICE_KEY=<your-service-key>
railway variables set STRIPE_SECRET_KEY=<your-stripe-secret>
railway variables set STRIPE_WEBHOOK_SECRET=<webhook-secret>
railway variables set STRIPE_PRICE_PRO=price_1SFHqPKdqvrj50kO9o4pTyKq
railway variables set STRIPE_PRICE_BUSINESS=price_1SFHqbKdqvrj50kOoPhNdiYT
railway variables set FRONTEND_URL=https://vgcmail.app
```

4. **Get your backend URL:**
```bash
railway domain
```

### Option B: Render

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect GitHub repository
4. Configure:
   - **Name:** vgcmail-api
   - **Root Directory:** backend
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
5. Add environment variables (same as above)
6. Click "Create Web Service"

### Option C: Fly.io

1. **Install Fly CLI:**
```bash
curl -L https://fly.io/install.sh | sh
fly auth login
```

2. **Deploy:**
```bash
cd /home/ubuntu/vgcmail-app/backend
fly launch
fly secrets set SUPABASE_URL=https://rsrmzsqfxwltwptgvpiz.supabase.co
fly secrets set SUPABASE_SERVICE_KEY=<your-service-key>
# ... set other secrets
fly deploy
```

---

## 🌐 Step 4: Deploy Frontend

### Option A: Vercel (Recommended)

1. **Install Vercel CLI:**
```bash
npm install -g vercel
vercel login
```

2. **Deploy:**
```bash
cd /home/ubuntu/vgcmail-app/frontend
vercel
```

3. **Set Environment Variables:**
```bash
vercel env add VITE_API_URL
# Enter: https://your-backend-url.railway.app

vercel env add VITE_STRIPE_PUBLISHABLE_KEY
# Enter: pk_live_...
```

4. **Deploy to Production:**
```bash
vercel --prod
```

### Option B: Netlify

1. Go to https://netlify.com
2. Click "Add new site" → "Import an existing project"
3. Connect GitHub repository
4. Configure:
   - **Base directory:** frontend
   - **Build command:** `pnpm run build`
   - **Publish directory:** frontend/dist
5. Add environment variables:
   - `VITE_API_URL`: Your backend URL
   - `VITE_STRIPE_PUBLISHABLE_KEY`: Your Stripe key
6. Click "Deploy site"

---

## 🌍 Step 5: Configure Custom Domain

### For Vercel:
1. Go to your project settings
2. Click "Domains"
3. Add `vgcmail.app` and `www.vgcmail.app`
4. Update DNS records at your registrar:
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

### For Backend (Railway):
1. Go to your service settings
2. Click "Settings" → "Networking"
3. Add custom domain: `api.vgcmail.app`
4. Update DNS:
   ```
   Type: CNAME
   Name: api
   Value: your-app.up.railway.app
   ```

---

## 🔔 Step 6: Configure Stripe Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. **Endpoint URL:** `https://api.vgcmail.app/api/webhooks/stripe`
4. **Events to send:**
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Copy the webhook signing secret
6. Update backend environment variable:
   ```bash
   railway variables set STRIPE_WEBHOOK_SECRET=whsec_...
   ```

---

## 🔐 Step 7: Update Supabase Auth

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add site URL: `https://vgcmail.app`
3. Add redirect URLs:
   - `https://vgcmail.app/dashboard`
   - `https://vgcmail.app/login`
   - `https://vgcmail.app/signup`

---

## 🧪 Step 8: Testing

### Test Signup Flow:
1. Go to https://vgcmail.app/signup
2. Create a new account
3. Verify email (if confirmation enabled)
4. Check Supabase users table

### Test Stripe Checkout:
1. Go to https://vgcmail.app/pricing
2. Click "Start Pro Trial"
3. Use test card: `4242 4242 4242 4242`
4. Complete checkout
5. Verify subscription in Stripe Dashboard
6. Check user subscription_tier in Supabase

### Test Email Tracking:
1. Create a tracked email via API
2. Open the tracking pixel URL
3. Check email_opens table in Supabase

---

## 📊 Step 9: Monitoring

### Backend Monitoring:
- Railway: Built-in metrics
- Render: Metrics tab
- Fly.io: `fly logs`

### Frontend Monitoring:
- Vercel Analytics (free)
- Google Analytics
- Sentry for error tracking

### Database Monitoring:
- Supabase Dashboard → Database → Logs
- Set up alerts for high usage

---

## 🔄 Step 10: CI/CD Setup

### GitHub Actions for Auto-Deploy:

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: cd frontend && pnpm install && pnpm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: cd backend && npm install
      - uses: railway-app/railway-action@v1
        with:
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
```

---

## 🛡️ Security Checklist

- [ ] All environment variables set correctly
- [ ] Stripe webhook secret configured
- [ ] Supabase RLS policies active
- [ ] CORS configured for production domain
- [ ] HTTPS enabled (automatic with Vercel/Railway)
- [ ] API rate limiting (optional)
- [ ] Monitoring and alerts set up

---

## 📝 Post-Deployment Tasks

1. **Update Chrome Extension:**
   - Change backend URL to production
   - Publish to Chrome Web Store
   - Update extension listing

2. **Documentation:**
   - Create help center
   - Write API documentation
   - Record demo videos

3. **Marketing:**
   - Launch on Product Hunt
   - Social media announcements
   - Email existing users (if any)

4. **Analytics:**
   - Set up Google Analytics
   - Configure conversion tracking
   - Monitor user behavior

---

## 🐛 Troubleshooting

### Backend not connecting to Supabase:
- Check SUPABASE_SERVICE_KEY is correct
- Verify network access in Supabase settings

### Stripe checkout not working:
- Verify publishable key in frontend
- Check webhook endpoint is accessible
- Look at Stripe webhook logs

### Frontend not loading:
- Check build logs in Vercel/Netlify
- Verify environment variables are set
- Check browser console for errors

### CORS errors:
- Update FRONTEND_URL in backend .env
- Restart backend service
- Clear browser cache

---

## 📞 Support

If you encounter issues during deployment:
1. Check logs in your hosting platform
2. Review Supabase logs
3. Check Stripe webhook logs
4. Contact support@vgcmail.app

---

## 🎉 Success!

Once deployed, your app will be live at:
- **Frontend:** https://vgcmail.app
- **Backend API:** https://api.vgcmail.app
- **Dashboard:** https://vgcmail.app/dashboard

**Congratulations on deploying your SaaS application!** 🚀
