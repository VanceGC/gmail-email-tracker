// This script runs in the page context to intercept Gmail's send functionality
(function() {
  console.log('Gmail Email Tracker: Gmail integration script loaded');
  
  // Store original XMLHttpRequest
  const originalXHR = window.XMLHttpRequest;
  const originalFetch = window.fetch;
  
  // Track pending emails waiting for tracking data
  const pendingEmails = new Map();
  
  // Listen for tracking data from content script
  window.addEventListener('message', (event) => {
    if (event.data.type === 'GMAIL_TRACKING_DATA') {
      console.log('Gmail Email Tracker: Received tracking data', event.data.payload);
      
      // Store tracking data for next send
      window.__emailTrackerData = event.data.payload;
    }
  });
  
  // Intercept XMLHttpRequest (Gmail uses this for sending emails)
  window.XMLHttpRequest = function() {
    const xhr = new originalXHR();
    
    const originalOpen = xhr.open;
    const originalSend = xhr.send;
    
    let method, url;
    
    xhr.open = function(m, u) {
      method = m;
      url = u;
      return originalOpen.apply(this, arguments);
    };
    
    xhr.send = function(data) {
      // Check if this is a Gmail send request
      if (method === 'POST' && url && url.includes('?act=sm')) {
        console.log('Gmail Email Tracker: Send request detected');
        
        try {
          // Parse email data
          const emailData = parseGmailSendData(data);
          
          if (emailData) {
            // Notify content script
            window.postMessage({
              type: 'GMAIL_SEND_EMAIL',
              payload: emailData
            }, '*');
            
            // If we have tracking data, inject it
            if (window.__emailTrackerData) {
              data = injectTrackingData(data, window.__emailTrackerData);
              window.__emailTrackerData = null; // Clear after use
            }
          }
        } catch (error) {
          console.error('Gmail Email Tracker: Error processing send', error);
        }
      }
      
      return originalSend.call(this, data);
    };
    
    return xhr;
  };
  
  // Parse Gmail send data
  function parseGmailSendData(data) {
    try {
      // Gmail sends data as FormData or string
      let emailBody = '';
      let subject = '';
      let to = '';
      
      if (typeof data === 'string') {
        // Parse URL-encoded data
        const params = new URLSearchParams(data);
        
        // Extract subject
        const subjectMatch = data.match(/subject=([^&]*)/);
        if (subjectMatch) {
          subject = decodeURIComponent(subjectMatch[1]);
        }
        
        // Extract to
        const toMatch = data.match(/to=([^&]*)/);
        if (toMatch) {
          to = decodeURIComponent(toMatch[1]);
        }
        
        // Extract body
        const bodyMatch = data.match(/body=([^&]*)/);
        if (bodyMatch) {
          emailBody = decodeURIComponent(bodyMatch[1]);
        }
      }
      
      return {
        subject,
        to,
        body: emailBody
      };
    } catch (error) {
      console.error('Gmail Email Tracker: Error parsing email data', error);
      return null;
    }
  }
  
  // Inject tracking pixel and wrapped links into email
  function injectTrackingData(data, trackingData) {
    try {
      const { pixelUrl, wrappedLinks } = trackingData;
      
      // Create tracking pixel HTML
      const trackingPixel = `<img src="${pixelUrl}" width="1" height="1" style="display:none;" alt="" />`;
      
      if (typeof data === 'string') {
        // Find body content and append tracking pixel
        let modifiedData = data;
        
        // Inject tracking pixel at end of body
        if (modifiedData.includes('body=')) {
          // Append pixel to body content
          const bodyMatch = modifiedData.match(/body=([^&]*)/);
          if (bodyMatch) {
            const originalBody = decodeURIComponent(bodyMatch[1]);
            const newBody = originalBody + trackingPixel;
            modifiedData = modifiedData.replace(
              bodyMatch[0],
              'body=' + encodeURIComponent(newBody)
            );
          }
        }
        
        // Replace links with wrapped versions
        for (const [originalUrl, wrappedUrl] of Object.entries(wrappedLinks)) {
          const encodedOriginal = encodeURIComponent(originalUrl);
          const encodedWrapped = encodeURIComponent(wrappedUrl);
          modifiedData = modifiedData.replace(
            new RegExp(encodedOriginal, 'g'),
            encodedWrapped
          );
        }
        
        return modifiedData;
      }
      
      return data;
    } catch (error) {
      console.error('Gmail Email Tracker: Error injecting tracking data', error);
      return data;
    }
  }
  
  console.log('Gmail Email Tracker: Gmail integration complete');
})();
