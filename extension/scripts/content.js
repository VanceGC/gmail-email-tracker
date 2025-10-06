// Content script that runs on Gmail pages
console.log('Gmail Email Tracker: Content script loaded');

// Inject the Gmail integration script
const script = document.createElement('script');
script.src = chrome.runtime.getURL('scripts/gmail-integration.js');
script.onload = function() {
  this.remove();
};
(document.head || document.documentElement).appendChild(script);

// Listen for messages from the injected script
window.addEventListener('message', async (event) => {
  // Only accept messages from same origin
  if (event.source !== window) return;
  
  if (event.data.type === 'GMAIL_SEND_EMAIL') {
    console.log('Gmail Email Tracker: Email send detected', event.data);
    
    // Get settings
    const settings = await chrome.storage.sync.get(['backendUrl', 'userEmail', 'autoTrack']);
    
    if (!settings.autoTrack) {
      console.log('Gmail Email Tracker: Auto-tracking disabled');
      return;
    }
    
    if (!settings.backendUrl || !settings.userEmail) {
      console.warn('Gmail Email Tracker: Not configured');
      return;
    }
    
    try {
      // Extract email data
      const emailData = event.data.payload;
      
      // Extract links from email body
      const links = extractLinks(emailData.body);
      
      // Create tracking pixel
      const response = await fetch(`${settings.backendUrl}/api/pixels/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email_subject: emailData.subject || 'No Subject',
          recipient_email: emailData.to || 'Unknown',
          user_id: settings.userEmail,
          links: links
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create tracking pixel');
      }
      
      const data = await response.json();
      console.log('Gmail Email Tracker: Tracking pixel created', data);
      
      // Send tracking data back to injected script
      window.postMessage({
        type: 'GMAIL_TRACKING_DATA',
        payload: {
          pixelUrl: data.tracking_url,
          wrappedLinks: data.wrapped_links
        }
      }, '*');
      
    } catch (error) {
      console.error('Gmail Email Tracker: Error creating tracking pixel', error);
    }
  }
});

// Extract links from HTML content
function extractLinks(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const anchors = doc.querySelectorAll('a[href]');
  
  const links = [];
  anchors.forEach(anchor => {
    const href = anchor.getAttribute('href');
    if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
      links.push(href);
    }
  });
  
  return [...new Set(links)]; // Remove duplicates
}

// Add visual indicator to Gmail UI
function addTrackingIndicator() {
  // Check if we're in compose view
  const composeWindows = document.querySelectorAll('[role="dialog"]');
  
  composeWindows.forEach(window => {
    // Check if indicator already exists
    if (window.querySelector('.email-tracker-indicator')) {
      return;
    }
    
    // Find the send button area
    const sendButton = window.querySelector('[data-tooltip*="Send"]');
    if (!sendButton) return;
    
    // Create indicator
    const indicator = document.createElement('div');
    indicator.className = 'email-tracker-indicator';
    indicator.innerHTML = '📧 Tracking enabled';
    indicator.style.cssText = `
      display: inline-block;
      margin-left: 10px;
      padding: 4px 8px;
      background: #e3f2fd;
      color: #1976d2;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    `;
    
    // Insert after send button
    sendButton.parentElement.appendChild(indicator);
  });
}

// Monitor for compose windows
const observer = new MutationObserver(() => {
  chrome.storage.sync.get(['autoTrack'], (settings) => {
    if (settings.autoTrack !== false) {
      addTrackingIndicator();
    }
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Initial check
chrome.storage.sync.get(['autoTrack'], (settings) => {
  if (settings.autoTrack !== false) {
    setTimeout(addTrackingIndicator, 1000);
  }
});
