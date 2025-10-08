// Content script that runs on Gmail pages

console.log('VGCMail extension content script v2 loaded');

// Inject the Gmail integration script into the page context
const script = document.createElement('script');
script.src = chrome.runtime.getURL('scripts/gmail-integration-v2.js');
script.onload = function() {
  console.log('VGCMail: Gmail integration script injected');
  this.remove();
};
(document.head || document.documentElement).appendChild(script);

// Listen for messages from page script
window.addEventListener('message', async (event) => {
  if (event.source !== window) return;
  
  if (event.data.type === 'VGCMAIL_GET_SETTINGS') {
    console.log('VGCMail Content: Settings requested from page script');
    
    try {
      const settings = await chrome.storage.sync.get(['apiKey', 'userId']);
      
      console.log('VGCMail Content: Retrieved from storage', { 
        hasApiKey: !!settings.apiKey, 
        userId: settings.userId 
      });
      
      // Send settings back to page script
      window.postMessage({
        type: 'VGCMAIL_SETTINGS_RESPONSE',
        payload: {
          apiKey: settings.apiKey || null,
          userId: settings.userId || null
        }
      }, '*');
      
      console.log('VGCMail Content: Settings sent to page script');
    } catch (error) {
      console.error('VGCMail Content: Error getting settings:', error);
      // Send empty settings
      window.postMessage({
        type: 'VGCMAIL_SETTINGS_RESPONSE',
        payload: {
          apiKey: null,
          userId: null
        }
      }, '*');
    }
  }
  
  // Handle tracking creation request
  if (event.data.type === 'VGCMAIL_CREATE_TRACKING') {
    console.log('VGCMail Content: Tracking creation requested');
    
    try {
      const { trackingId, subject, recipient, apiKey } = event.data.payload;
      
      // Make API call from content script (has extension permissions)
      const response = await fetch('https://api.vgcmail.app/api/track/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          trackingId: trackingId,
          subject: subject,
          recipient: recipient
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('VGCMail Content: Tracking created successfully');
        
        // Send success back to page script
        window.postMessage({
          type: 'VGCMAIL_TRACKING_CREATED',
          payload: result
        }, '*');
      } else {
        const errorData = await response.json();
        console.error('VGCMail Content: Failed to create tracking:', response.status, errorData);
        
        // Send error back to page script
        window.postMessage({
          type: 'VGCMAIL_TRACKING_ERROR',
          payload: { error: errorData.error || 'Failed to create tracking' }
        }, '*');
      }
    } catch (error) {
      console.error('VGCMail Content: Error creating tracking:', error);
      
      // Send error back to page script
      window.postMessage({
        type: 'VGCMAIL_TRACKING_ERROR',
        payload: { error: error.message }
      }, '*');
    }
  }
});

// Log when extension is ready
console.log('VGCMail: Ready to track emails');
