const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to provide base URL to templates
app.use((req, res, next) => {
  const protocol = req.protocol;
  const host = req.get('host');
  res.locals.baseUrl = `${protocol}://${host}`;
  next();
});

// ============================================
// WEB ROUTES (Dashboard)
// ============================================

// Dashboard - List all tracked emails
app.get('/', (req, res) => {
  const userId = req.query.user_id || 'demo@example.com';
  
  db.all(
    `SELECT p.*, 
            COUNT(DISTINCT o.id) as open_count,
            COUNT(DISTINCT c.id) as click_count,
            MAX(o.opened_at) as last_opened
     FROM pixels p
     LEFT JOIN opens o ON p.id = o.pixel_id
     LEFT JOIN links l ON p.id = l.pixel_id
     LEFT JOIN clicks c ON l.id = c.link_id
     WHERE p.user_id = ?
     GROUP BY p.id
     ORDER BY p.created_at DESC`,
    [userId],
    (err, pixels) => {
      if (err) {
        console.error('Error fetching pixels:', err);
        return res.status(500).send('Database error');
      }
      res.render('index', { pixels, userId });
    }
  );
});

// View detailed logs for a specific email
app.get('/logs/:pixel_id', (req, res) => {
  const { pixel_id } = req.params;
  
  // Get pixel info
  db.get('SELECT * FROM pixels WHERE id = ?', [pixel_id], (err, pixel) => {
    if (err || !pixel) {
      return res.status(404).send('Pixel not found');
    }
    
    // Get opens
    db.all(
      'SELECT * FROM opens WHERE pixel_id = ? ORDER BY opened_at DESC',
      [pixel_id],
      (err, opens) => {
        if (err) {
          console.error('Error fetching opens:', err);
          opens = [];
        }
        
        // Get clicks
        db.all(
          `SELECT c.*, l.original_url 
           FROM clicks c
           JOIN links l ON c.link_id = l.id
           WHERE l.pixel_id = ?
           ORDER BY c.clicked_at DESC`,
          [pixel_id],
          (err, clicks) => {
            if (err) {
              console.error('Error fetching clicks:', err);
              clicks = [];
            }
            
            res.render('logs', { pixel, opens, clicks });
          }
        );
      }
    );
  });
});

// ============================================
// API ROUTES
// ============================================

// Create new tracking pixel
app.post('/api/pixels/create', (req, res) => {
  const { email_subject, recipient_email, user_id, links } = req.body;
  
  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }
  
  const pixelId = uuidv4();
  
  // Insert pixel
  db.run(
    'INSERT INTO pixels (id, email_subject, recipient_email, user_id) VALUES (?, ?, ?, ?)',
    [pixelId, email_subject || 'Untitled', recipient_email || 'Unknown', user_id],
    function(err) {
      if (err) {
        console.error('Error creating pixel:', err);
        return res.status(500).json({ error: 'Failed to create pixel' });
      }
      
      // Process links if provided
      const wrappedLinks = {};
      if (links && Array.isArray(links)) {
        const linkPromises = links.map(originalUrl => {
          return new Promise((resolve, reject) => {
            const linkId = uuidv4();
            db.run(
              'INSERT INTO links (id, pixel_id, original_url) VALUES (?, ?, ?)',
              [linkId, pixelId, originalUrl],
              (err) => {
                if (err) {
                  console.error('Error creating link:', err);
                  reject(err);
                } else {
                  const protocol = req.protocol;
                  const host = req.get('host');
                  wrappedLinks[originalUrl] = `${protocol}://${host}/click/${linkId}?redirect=${encodeURIComponent(originalUrl)}`;
                  resolve();
                }
              }
            );
          });
        });
        
        Promise.all(linkPromises)
          .then(() => {
            const protocol = req.protocol;
            const host = req.get('host');
            res.json({
              pixel_id: pixelId,
              tracking_url: `${protocol}://${host}/tracker/${pixelId}.png`,
              wrapped_links: wrappedLinks
            });
          })
          .catch(err => {
            res.status(500).json({ error: 'Failed to create links' });
          });
      } else {
        const protocol = req.protocol;
        const host = req.get('host');
        res.json({
          pixel_id: pixelId,
          tracking_url: `${protocol}://${host}/tracker/${pixelId}.png`,
          wrapped_links: wrappedLinks
        });
      }
    }
  );
});

// Get all pixels for a user
app.get('/api/pixels/:user_id', (req, res) => {
  const { user_id } = req.params;
  
  db.all(
    `SELECT p.*, 
            COUNT(DISTINCT o.id) as open_count,
            COUNT(DISTINCT c.id) as click_count
     FROM pixels p
     LEFT JOIN opens o ON p.id = o.pixel_id
     LEFT JOIN links l ON p.id = l.pixel_id
     LEFT JOIN clicks c ON l.id = c.link_id
     WHERE p.user_id = ?
     GROUP BY p.id
     ORDER BY p.created_at DESC`,
    [user_id],
    (err, pixels) => {
      if (err) {
        console.error('Error fetching pixels:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ pixels });
    }
  );
});

// Get tracking statistics for a specific pixel
app.get('/api/pixels/:pixel_id/stats', (req, res) => {
  const { pixel_id } = req.params;
  
  // Get opens
  db.all(
    'SELECT * FROM opens WHERE pixel_id = ? ORDER BY opened_at DESC',
    [pixel_id],
    (err, opens) => {
      if (err) {
        console.error('Error fetching opens:', err);
        opens = [];
      }
      
      // Get clicks
      db.all(
        `SELECT c.*, l.original_url 
         FROM clicks c
         JOIN links l ON c.link_id = l.id
         WHERE l.pixel_id = ?
         ORDER BY c.clicked_at DESC`,
        [pixel_id],
        (err, clicks) => {
          if (err) {
            console.error('Error fetching clicks:', err);
            clicks = [];
          }
          
          res.json({
            opens,
            clicks,
            total_opens: opens.length,
            total_clicks: clicks.length
          });
        }
      );
    }
  );
});

// ============================================
// TRACKING ROUTES
// ============================================

// Tracking pixel endpoint
app.get('/tracker/:pixel_id.png', (req, res) => {
  const { pixel_id } = req.params;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('user-agent') || 'Unknown';
  
  // Log the open event
  db.run(
    'INSERT INTO opens (pixel_id, ip_address, user_agent) VALUES (?, ?, ?)',
    [pixel_id, ipAddress, userAgent],
    (err) => {
      if (err) {
        console.error('Error logging open:', err);
      }
    }
  );
  
  // Serve the tracking pixel
  res.sendFile(path.join(__dirname, 'public', 'images', 'pixel.png'));
});

// Link click tracking and redirect
app.get('/click/:link_id', (req, res) => {
  const { link_id } = req.params;
  const { redirect } = req.query;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('user-agent') || 'Unknown';
  
  // Log the click event
  db.run(
    'INSERT INTO clicks (link_id, ip_address, user_agent) VALUES (?, ?, ?)',
    [link_id, ipAddress, userAgent],
    (err) => {
      if (err) {
        console.error('Error logging click:', err);
      }
    }
  );
  
  // Redirect to original URL
  if (redirect) {
    res.redirect(redirect);
  } else {
    // Fallback: try to get original URL from database
    db.get('SELECT original_url FROM links WHERE id = ?', [link_id], (err, link) => {
      if (err || !link) {
        return res.status(404).send('Link not found');
      }
      res.redirect(link.original_url);
    });
  }
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Email Tracker Server running on http://0.0.0.0:${PORT}`);
  console.log(`Dashboard: http://0.0.0.0:${PORT}`);
  console.log(`API: http://0.0.0.0:${PORT}/api`);
});
