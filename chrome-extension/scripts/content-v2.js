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

// Listen for settings request from page script
window.addEventListener('message', async (event) => {
  if (event.source !== window) return;
  
  if (event.data.type === 'VGCMAIL_GET_SETTINGS') {
    console.log('VGCMail: Settings requested');
    
    try {
      const settings = await chrome.storage.sync.get(['apiKey', 'userId']);
      
      // Send settings back to page script
      window.postMessage({
        type: 'VGCMAIL_SETTINGS_RESPONSE',
        payload: {
          apiKey: settings.apiKey || null,
          userId: settings.userId || null
        }
      }, '*');
      
      console.log('VGCMail: Settings sent to page script');
    } catch (error) {
      console.error('VGCMail: Error getting settings:', error);
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
});

// Log when extension is ready
console.log('VGCMail: Ready to track emails');
