require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'VGCMail API is running' });
});

// Create Stripe checkout session
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { priceId, userId, userEmail } = req.body;

    if (!priceId || !userId || !userEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get or create Stripe customer
    const { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    let customerId = user?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          supabase_user_id: userId
        }
      });
      customerId = customer.id;

      // Update user with Stripe customer ID
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          supabase_user_id: userId
        }
      },
      metadata: {
        supabase_user_id: userId
      }
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create Stripe portal session (for managing subscription)
app.post('/api/create-portal-session', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (!user?.stripe_customer_id) {
      return res.status(404).json({ error: 'No Stripe customer found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL}/dashboard`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stripe webhook handler
app.post('/api/webhooks/stripe', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata.supabase_user_id;
        const subscriptionId = session.subscription;

        // Update user subscription status
        await supabase
          .from('users')
          .update({
            stripe_subscription_id: subscriptionId,
            subscription_status: 'active',
            subscription_tier: session.mode === 'subscription' ? 'pro' : 'free',
            tracking_limit: -1 // Unlimited for paid plans
          })
          .eq('id', userId);

        console.log('Checkout session completed for user:', userId);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const userId = subscription.metadata.supabase_user_id;

        // Determine tier based on price
        let tier = 'free';
        if (subscription.items.data[0].price.id === process.env.STRIPE_PRICE_PRO) {
          tier = 'pro';
        } else if (subscription.items.data[0].price.id === process.env.STRIPE_PRICE_BUSINESS) {
          tier = 'business';
        }

        await supabase
          .from('users')
          .update({
            subscription_status: subscription.status,
            subscription_tier: tier,
            tracking_limit: tier === 'free' ? 50 : -1
          })
          .eq('stripe_subscription_id', subscription.id);

        console.log('Subscription updated:', subscription.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;

        await supabase
          .from('users')
          .update({
            subscription_status: 'canceled',
            subscription_tier: 'free',
            tracking_limit: 50
          })
          .eq('stripe_subscription_id', subscription.id);

        console.log('Subscription canceled:', subscription.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;

        await supabase
          .from('users')
          .update({
            subscription_status: 'past_due'
          })
          .eq('stripe_subscription_id', subscriptionId);

        console.log('Payment failed for subscription:', subscriptionId);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Track email endpoint
app.post('/api/track/email', async (req, res) => {
  try {
    const { userId, emailSubject, recipientEmail } = req.body;

    if (!userId || !emailSubject || !recipientEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user can track more emails
    const { data: canTrack } = await supabase
      .rpc('can_track_email', { p_user_id: userId });

    if (!canTrack) {
      return res.status(403).json({ 
        error: 'Tracking limit reached',
        message: 'Upgrade to Pro for unlimited tracking'
      });
    }

    // Create tracked email
    const { data: trackedEmail, error } = await supabase
      .from('tracked_emails')
      .insert({
        user_id: userId,
        email_subject: emailSubject,
        recipient_email: recipientEmail
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ 
      success: true,
      trackingId: trackedEmail.id,
      pixelUrl: `${req.protocol}://${req.get('host')}/api/track/pixel/${trackedEmail.id}`,
      linkTrackUrl: `${req.protocol}://${req.get('host')}/api/track/link`
    });
  } catch (error) {
    console.error('Error tracking email:', error);
    res.status(500).json({ error: error.message });
  }
});

// Tracking pixel endpoint
app.get('/api/track/pixel/:emailId', async (req, res) => {
  try {
    const { emailId } = req.params;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Log email open
    await supabase
      .from('email_opens')
      .insert({
        tracked_email_id: emailId,
        ip_address: ipAddress,
        user_agent: userAgent
      });

    // Send 1x1 transparent pixel
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': pixel.length,
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.end(pixel);
  } catch (error) {
    console.error('Error tracking pixel:', error);
    res.status(500).end();
  }
});

// Link click tracking endpoint
app.get('/api/track/link/:linkId', async (req, res) => {
  try {
    const { linkId } = req.params;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Get original URL
    const { data: link } = await supabase
      .from('tracked_links')
      .select('original_url')
      .eq('id', linkId)
      .single();

    if (!link) {
      return res.status(404).send('Link not found');
    }

    // Log click
    await supabase
      .from('link_clicks')
      .insert({
        tracked_link_id: linkId,
        ip_address: ipAddress,
        user_agent: userAgent
      });

    // Redirect to original URL
    res.redirect(link.original_url);
  } catch (error) {
    console.error('Error tracking link:', error);
    res.status(500).send('Error tracking link');
  }
});

// Create tracked link
app.post('/api/track/create-link', async (req, res) => {
  try {
    const { emailId, originalUrl } = req.body;

    if (!emailId || !originalUrl) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data: link, error } = await supabase
      .from('tracked_links')
      .insert({
        tracked_email_id: emailId,
        original_url: originalUrl
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      trackingUrl: `${req.protocol}://${req.get('host')}/api/track/link/${link.id}`
    });
  } catch (error) {
    console.error('Error creating tracked link:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's tracked emails
app.get('/api/emails/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: emails, error } = await supabase
      .from('email_stats')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ emails });
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get email details
app.get('/api/email/:emailId', async (req, res) => {
  try {
    const { emailId } = req.params;

    // Get email with stats
    const { data: email, error: emailError } = await supabase
      .from('email_stats')
      .select('*')
      .eq('email_id', emailId)
      .single();

    if (emailError) throw emailError;

    // Get opens
    const { data: opens, error: opensError } = await supabase
      .from('email_opens')
      .select('*')
      .eq('tracked_email_id', emailId)
      .order('opened_at', { ascending: false });

    if (opensError) throw opensError;

    // Get links and clicks
    const { data: links, error: linksError } = await supabase
      .from('tracked_links')
      .select(`
        *,
        link_clicks (*)
      `)
      .eq('tracked_email_id', emailId);

    if (linksError) throw linksError;

    res.json({ email, opens, links });
  } catch (error) {
    console.error('Error fetching email details:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ VGCMail API server running on port ${PORT}`);
  console.log(`📧 Health check: http://localhost:${PORT}/health`);
});
