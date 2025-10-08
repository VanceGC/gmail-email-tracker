require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const GmailService = require('./gmailService');

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

// ==================== GMAIL API ROUTES ====================

// Get user's Gmail sent emails
app.get('/api/gmail/sent-emails', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Get user from Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user's provider token from Supabase
    const { data: session } = await supabase.auth.getSession();
    const providerToken = session?.provider_token;
    const providerRefreshToken = session?.provider_refresh_token;

    if (!providerToken) {
      return res.status(400).json({ error: 'No Gmail access token found. Please reconnect your Google account.' });
    }

    const gmailService = new GmailService(providerToken, providerRefreshToken);
    const emails = await gmailService.getSentEmails(20);

    res.json({ emails });
  } catch (error) {
    console.error('Error fetching Gmail sent emails:', error);
    res.status(500).json({ error: error.message });
  }
});

// Sync sent emails and create tracking records
app.post('/api/gmail/sync-emails', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { providerToken, providerRefreshToken } = req.body;

    // Get user from Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (!providerToken) {
      return res.status(400).json({ error: 'No Gmail access token found. Please sign out and sign in again with Google.' });
    }

    const gmailService = new GmailService(providerToken, providerRefreshToken);
    const emails = await gmailService.getSentEmails(50);

    // Store emails in database with tracking
    const trackedEmails = [];
    for (const email of emails) {
      // Check if email already tracked (by subject and recipient as we don't store gmail_message_id)
      const { data: existing } = await supabase
        .from('tracked_emails')
        .select('id')
        .eq('email_subject', email.subject)
        .eq('recipient_email', email.to)
        .eq('user_id', user.id)
        .single();

      if (!existing) {
        // Create tracking record
        const { data: tracked, error: trackError } = await supabase
          .from('tracked_emails')
          .insert({
            user_id: user.id,
            email_subject: email.subject,
            recipient_email: email.to,
          })
          .select()
          .single();

        if (!trackError) {
          trackedEmails.push(tracked);
        } else {
          console.error('Error inserting tracked email:', trackError);
        }
      }
    }

    res.json({ 
      message: 'Emails synced successfully',
      synced: trackedEmails.length,
      total: emails.length 
    });
  } catch (error) {
    console.error('Error syncing emails:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get tracked emails for user
app.get('/api/tracked-emails', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Get user from Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Use the email_stats view for proper aggregation
    const { data: emails, error } = await supabase
      .from('email_stats')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    // Format the response with proper field names
    const formattedEmails = emails.map(email => ({
      id: email.email_id,
      user_id: email.user_id,
      subject: email.email_subject,
      recipient: email.recipient_email,
      sent_at: email.created_at,
      created_at: email.created_at,
      open_count: email.open_count || 0,
      click_count: email.click_count || 0,
      last_opened_at: email.last_opened_at,
      last_clicked_at: email.last_clicked_at
    }));

    res.json({ emails: formattedEmails });
  } catch (error) {
    console.error('Error fetching tracked emails:', error);
    res.status(500).json({ error: error.message });
  }
});

// Extension API: Generate API key for user
app.post('/api/generate-api-key', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Call Supabase function to generate API key
    const { data, error } = await supabase.rpc('create_user_api_key', {
      p_user_id: user.id
    });

    if (error) throw error;

    res.json({
      success: true,
      apiKey: data,
      userId: user.id,
      email: user.email
    });
  } catch (error) {
    console.error('Error generating API key:', error);
    res.status(500).json({ error: error.message });
  }
});

// Extension API: Get user's API key
app.get('/api/get-api-key', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user's API key from database
    const { data: profile, error } = await supabase
      .from('users')
      .select('api_key')
      .eq('id', user.id)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      apiKey: profile?.api_key || null,
      hasKey: !!profile?.api_key
    });
  } catch (error) {
    console.error('Error getting API key:', error);
    res.status(500).json({ error: error.message });
  }
});

// Extension API: Verify API key
app.post('/api/verify-key', async (req, res) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API key required' });
    }

    // Look up user by API key using Supabase function
    const { data, error } = await supabase.rpc('get_user_by_api_key', {
      p_api_key: apiKey
    });

    if (error || !data || data.length === 0) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const userInfo = data[0];

    res.json({
      valid: true,
      email: userInfo.email,
      userId: userInfo.user_id,
      subscription: userInfo.subscription_tier
    });
  } catch (error) {
    console.error('Error verifying API key:', error);
    res.status(500).json({ error: error.message });
  }
});

// Extension API: Create tracking
app.post('/api/track/create', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    let userId;

    // Try API key first (starts with 'vgc_')
    if (token.startsWith('vgc_')) {
      const { data, error } = await supabase.rpc('get_user_by_api_key', {
        p_api_key: token
      });
      
      if (error || !data || data.length === 0) {
        return res.status(401).json({ error: 'Invalid API key' });
      }
      
      userId = data[0].user_id;
    } else {
      // Try as auth token
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      
      userId = user.id;
    }

    const { trackingId, subject, recipient } = req.body;

    // Create tracked email
    const { data: tracked, error } = await supabase
      .from('tracked_emails')
      .insert({
        id: trackingId,
        user_id: userId,
        email_subject: subject,
        recipient_email: recipient
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      trackingId: tracked.id,
      pixelUrl: `${process.env.FRONTEND_URL || 'https://api.vgcmail.app'}/api/track/open/${trackingId}`
    });
  } catch (error) {
    console.error('Error creating tracking:', error);
    res.status(500).json({ error: error.message });
  }
});

// Extension API: Track email open
app.get('/api/track/open/:trackingId', async (req, res) => {
  try {
    const { trackingId } = req.params;

    // Record the open
    const { error } = await supabase
      .from('email_opens')
      .insert({
        tracked_email_id: trackingId,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });

    if (error) {
      console.error('Error recording open:', error);
    }

    // Return 1x1 transparent pixel
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.send(pixel);
  } catch (error) {
    console.error('Error tracking open:', error);
    res.status(500).send();
  }
});

// Extension API: Get stats
app.get('/api/stats', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get tracked emails count
    const { count: trackedCount } = await supabase
      .from('tracked_emails')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Get opens count
    const { count: opensCount } = await supabase
      .from('email_opens')
      .select('tracked_email_id, tracked_emails!inner(user_id)', { count: 'exact', head: true })
      .eq('tracked_emails.user_id', user.id);

    res.json({
      tracked: trackedCount || 0,
      opens: opensCount || 0
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ VGCMail API server running on port ${PORT}`);
  console.log(`📧 Health check: http://localhost:${PORT}/health`);
});
