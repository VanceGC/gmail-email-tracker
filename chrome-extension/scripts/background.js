// Background service worker for VGCMail extension

console.log('VGCMail background service worker started');

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('VGCMail extension installed');
    // Open welcome page
    chrome.tabs.create({ url: 'https://vgcmail.app/dashboard' });
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'TRACK_EMAIL') {
    handleEmailTracking(request.data)
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }));
    return true; // Keep channel open for async response
  }
});

async function handleEmailTracking(emailData) {
  try {
    const settings = await chrome.storage.sync.get(['apiKey']);
    
    if (!settings.apiKey) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch('https://api.vgcmail.app/api/track/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify(emailData)
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    } else {
      return { success: false, error: 'API error' };
    }
  } catch (error) {
    console.error('Error tracking email:', error);
    return { success: false, error: error.message };
  }
}
