// Background service worker for the extension
console.log('Gmail Email Tracker: Background service worker initialized');

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Gmail Email Tracker: Extension installed');
    
    // Set default settings
    chrome.storage.sync.set({
      backendUrl: 'http://localhost:3000',
      autoTrack: true
    });
    
    // Open welcome page
    chrome.tabs.create({
      url: 'https://mail.google.com'
    });
  } else if (details.reason === 'update') {
    console.log('Gmail Email Tracker: Extension updated');
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'EMAIL_TRACKED') {
    console.log('Gmail Email Tracker: Email tracked', request.data);
    
    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Email Tracked',
      message: 'Your email is now being tracked for opens and clicks.'
    });
  }
  
  if (request.type === 'EMAIL_OPENED') {
    console.log('Gmail Email Tracker: Email opened', request.data);
    
    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Email Opened!',
      message: `Your email "${request.data.subject}" was opened.`
    });
  }
  
  return true;
});

// Periodic check for new opens (optional feature)
chrome.alarms.create('checkOpens', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'checkOpens') {
    // Get settings
    const settings = await chrome.storage.sync.get(['backendUrl', 'userEmail']);
    
    if (!settings.backendUrl || !settings.userEmail) {
      return;
    }
    
    // Check for new opens (implementation would require storing last check time)
    console.log('Gmail Email Tracker: Checking for new opens...');
  }
});
