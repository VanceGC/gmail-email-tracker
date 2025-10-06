// Content script that runs on Gmail pages

console.log('VGCMail extension loaded');

// Inject the Gmail integration script
const script = document.createElement('script');
script.src = chrome.runtime.getURL('scripts/gmail-integration.js');
script.onload = function() {
  this.remove();
};
(document.head || document.documentElement).appendChild(script);

// Listen for messages from the injected script
window.addEventListener('message', async (event) => {
  if (event.source !== window) return;
  
  if (event.data.type === 'VGCMAIL_SEND_EMAIL') {
    const emailData = event.data.payload;
    
    // Get API key from storage
    const settings = await chrome.storage.sync.get(['apiKey', 'userId']);
    
    if (!settings.apiKey) {
      console.log('VGCMail: Not connected. Skipping tracking.');
      return;
    }

    // Generate tracking pixel URL
    const trackingId = generateTrackingId();
    const pixelUrl = `https://api.vgcmail.app/api/track/open/${trackingId}`;
    
    // Send tracking data to backend
    try {
      const response = await fetch('https://api.vgcmail.app/api/track/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`
        },
        body: JSON.stringify({
          trackingId: trackingId,
          subject: emailData.subject,
          recipient: emailData.to,
          userId: settings.userId
        })
      });

      if (response.ok) {
        console.log('VGCMail: Email tracked successfully');
        
        // Inject tracking pixel into email
        window.postMessage({
          type: 'VGCMAIL_INJECT_PIXEL',
          payload: {
            pixelUrl: pixelUrl,
            trackingId: trackingId
          }
        }, '*');
      }
    } catch (error) {
      console.error('VGCMail: Error creating tracking:', error);
    }
  }
});

function generateTrackingId() {
  return 'track_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}
