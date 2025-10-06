# 📧 VGCMail - Email Tracking for Gmail

> Know when your emails are opened and links are clicked

A complete SaaS application for tracking email opens and link clicks in Gmail, built with React, Node.js, Supabase, and Stripe.

**Live Demo:** Coming soon at [vgcmail.app](https://vgcmail.app)

---

## ✨ Features

- 📬 **Email Open Tracking** - Know exactly when recipients open your emails
- 🔗 **Link Click Tracking** - Track which links get clicked
- 📊 **Analytics Dashboard** - View comprehensive statistics
- 👥 **Multi-User Support** - Secure authentication with Supabase
- 💳 **Stripe Integration** - Subscription billing with 14-day free trial
- 🎨 **Beautiful UI** - Modern design with Tailwind CSS and animations
- 🔒 **Secure** - Row-level security and encrypted data
- 🚀 **Fast** - Built with modern technologies

---

## 🎯 Subscription Plans

### Free
- 50 tracked emails/month
- Email open tracking
- Basic analytics
- **$0/month**

### Pro
- **Unlimited** tracked emails
- Email open + link click tracking
- Advanced analytics
- Priority support
- **$9.99/month**

### Business
- Everything in Pro
- Team features
- API access
- Dedicated support
- **$29.99/month**

---

## 🛠️ Tech Stack

**Frontend:**
- React 19 + Vite
- Tailwind CSS + shadcn/ui
- Framer Motion
- React Router
- Supabase JS

**Backend:**
- Node.js + Express
- Supabase (PostgreSQL)
- Stripe API
- RESTful API

**Infrastructure:**
- Supabase for database & auth
- Stripe for payments
- GitHub for version control

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm (for frontend)
- Supabase account
- Stripe account

### 1. Clone the Repository
```bash
git clone https://github.com/VanceGC/vgcmail-app.git
cd vgcmail-app
```

### 2. Set Up Database
1. Create a Supabase project
2. Run the SQL in `supabase-schema.sql` in the SQL Editor
3. Enable email authentication

### 3. Configure Environment Variables

**Backend (.env):**
```env
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_webhook_secret
STRIPE_PRICE_PRO=your_pro_price_id
STRIPE_PRICE_BUSINESS=your_business_price_id
FRONTEND_URL=http://localhost:5173
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:3001
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### 4. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
pnpm install
```

### 5. Start Development Servers

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
pnpm run dev
```

Visit http://localhost:5173 to see the app!

---

## 📁 Project Structure

```
vgcmail-app/
├── backend/              # Express API server
│   ├── server.js        # Main server file
│   ├── .env             # Environment variables
│   └── package.json     # Dependencies
├── frontend/            # React application
│   ├── src/
│   │   ├── pages/      # Page components
│   │   ├── components/ # UI components
│   │   ├── lib/        # Utilities
│   │   └── App.jsx     # Main app
│   ├── .env            # Frontend config
│   └── package.json    # Dependencies
├── supabase-schema.sql # Database schema
├── PROJECT_SUMMARY.md  # Detailed documentation
├── DEPLOYMENT_GUIDE.md # Deployment instructions
└── README.md           # This file
```

---

## 🔌 API Endpoints

### Authentication
- Uses Supabase Auth (handled by frontend)

### Tracking
```
POST /api/track/email              - Create tracked email
GET  /api/track/pixel/:emailId     - Tracking pixel
GET  /api/track/link/:linkId       - Link click redirect
POST /api/track/create-link        - Create tracked link
```

### User Data
```
GET /api/emails/:userId            - Get user's tracked emails
GET /api/email/:emailId            - Get email details
```

### Billing
```
POST /api/create-checkout-session  - Start Stripe checkout
POST /api/create-portal-session    - Open billing portal
POST /api/webhooks/stripe          - Stripe webhook handler
```

---

## 🗄️ Database Schema

### Tables
- `users` - User profiles and subscriptions
- `tracked_emails` - Emails being tracked
- `email_opens` - Open event logs
- `tracked_links` - Links within emails
- `link_clicks` - Click event logs

### Views
- `email_stats` - Aggregated email statistics

### Functions
- `can_track_email()` - Check tracking limits
- `reset_monthly_tracking_counters()` - Reset monthly counters

See `supabase-schema.sql` for complete schema.

---

## 🔒 Security

- **Row Level Security (RLS)** - Users can only access their own data
- **Supabase Auth** - Secure authentication
- **Stripe Integration** - PCI-compliant payments
- **Environment Variables** - Sensitive data protected
- **CORS Configuration** - Restricted API access

---

## 🧪 Testing

### Test Stripe Checkout
Use these test cards:
- **Success:** 4242 4242 4242 4242
- **Decline:** 4000 0000 0000 0002
- **3D Secure:** 4000 0025 0000 3155

### Test Email Tracking
1. Create a tracked email via API
2. Open the pixel URL in a browser
3. Check the `email_opens` table

---

## 📚 Documentation

- **[Project Summary](PROJECT_SUMMARY.md)** - Complete feature list and architecture
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Step-by-step deployment instructions
- **[Supabase Schema](supabase-schema.sql)** - Database structure

---

## 🚀 Deployment

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed instructions.

**Quick Deploy:**
1. Deploy backend to Railway/Render
2. Deploy frontend to Vercel/Netlify
3. Configure Stripe webhooks
4. Update environment variables
5. Configure custom domain

---

## 🛣️ Roadmap

- [x] Multi-user authentication
- [x] Stripe subscription billing
- [x] Email open tracking
- [x] Link click tracking
- [x] Basic dashboard
- [ ] Enhanced analytics dashboard
- [ ] Real-time notifications
- [ ] Chrome extension multi-user auth
- [ ] Team collaboration features
- [ ] API access for Business plan
- [ ] Mobile app
- [ ] Email templates
- [ ] A/B testing

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 💬 Support

- **Email:** support@vgcmail.app
- **GitHub Issues:** [Create an issue](https://github.com/VanceGC/vgcmail-app/issues)
- **Documentation:** [Project Summary](PROJECT_SUMMARY.md)

---

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) - Backend infrastructure
- [Stripe](https://stripe.com) - Payment processing
- [shadcn/ui](https://ui.shadcn.com) - UI components
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Lucide Icons](https://lucide.dev) - Icons

---

## 📊 Stats

- **Frontend:** React 19 + Vite
- **Backend:** Node.js + Express
- **Database:** PostgreSQL (Supabase)
- **Payments:** Stripe
- **UI:** Tailwind CSS + shadcn/ui
- **Animations:** Framer Motion

---

**Built with ❤️ for email tracking professionals**

[Website](https://vgcmail.app) • [GitHub](https://github.com/VanceGC/vgcmail-app) • [Support](mailto:support@vgcmail.app)
