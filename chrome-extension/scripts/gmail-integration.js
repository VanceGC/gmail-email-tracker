// This script runs in the Gmail page context and intercepts email sends

(function() {
  'use strict';

  console.log('VGCMail Gmail integration active');

  let trackingEnabled = true;
  let pendingPixelInjection = null;

  // Listen for pixel injection messages
  window.addEventListener('message', (event) => {
    if (event.data.type === 'VGCMAIL_INJECT_PIXEL') {
      pendingPixelInjection = event.data.payload;
    }
  });

  // Observe Gmail compose windows
  const observer = new MutationObserver((mutations) => {
    // Look for compose windows
    const composeWindows = document.querySelectorAll('[role="dialog"]');
    
    composeWindows.forEach((dialog) => {
      if (!dialog.hasAttribute('data-vgcmail-initialized')) {
        dialog.setAttribute('data-vgcmail-initialized', 'true');
        initializeComposeWindow(dialog);
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  function initializeComposeWindow(dialog) {
    console.log('VGCMail: Initializing compose window');

    // Add tracking indicator
    addTrackingIndicator(dialog);

    // Intercept send button
    interceptSendButton(dialog);
  }

  function addTrackingIndicator(dialog) {
    // Find the toolbar area
    const toolbar = dialog.querySelector('[role="toolbar"]');
    if (!toolbar) return;

    // Create tracking indicator
    const indicator = document.createElement('div');
    indicator.id = 'vgcmail-indicator';
    indicator.style.cssText = `
      display: inline-flex;
      align-items: center;
      padding: 4px 8px;
      background: #d1fae5;
      color: #065f46;
      border-radius: 4px;
      font-size: 12px;
      margin-left: 8px;
      cursor: pointer;
    `;
    indicator.innerHTML = '📧 Tracking enabled';
    
    indicator.addEventListener('click', () => {
      trackingEnabled = !trackingEnabled;
      indicator.style.background = trackingEnabled ? '#d1fae5' : '#fee2e2';
      indicator.style.color = trackingEnabled ? '#065f46' : '#991b1b';
      indicator.innerHTML = trackingEnabled ? '📧 Tracking enabled' : '📧 Tracking disabled';
    });

    toolbar.appendChild(indicator);
  }

  function interceptSendButton(dialog) {
    // Find send button
    const sendButton = dialog.querySelector('[data-tooltip*="Send"]');
    if (!sendButton) {
      // Try again after a delay
      setTimeout(() => interceptSendButton(dialog), 500);
      return;
    }

    // Clone and replace to remove existing listeners
    const newSendButton = sendButton.cloneNode(true);
    sendButton.parentNode.replaceChild(newSendButton, sendButton);

    // Add our listener
    newSendButton.addEventListener('click', async (e) => {
      if (!trackingEnabled) {
        // Let Gmail handle it normally
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      // Extract email data
      const emailData = extractEmailData(dialog);
      
      // Notify content script
      window.postMessage({
        type: 'VGCMAIL_SEND_EMAIL',
        payload: emailData
      }, '*');

      // Wait for pixel injection
      await waitForPixelInjection();

      // Inject pixel into email body
      if (pendingPixelInjection) {
        injectTrackingPixel(dialog, pendingPixelInjection.pixelUrl);
        pendingPixelInjection = null;
      }

      // Now send the email
      sendEmail(dialog);
    }, true);
  }

  function extractEmailData(dialog) {
    const toField = dialog.querySelector('[name="to"]');
    const subjectField = dialog.querySelector('[name="subjectbox"]');
    const bodyField = dialog.querySelector('[contenteditable="true"][role="textbox"]');

    return {
      to: toField ? toField.value : '',
      subject: subjectField ? subjectField.value : '',
      body: bodyField ? bodyField.innerHTML : ''
    };
  }

  function waitForPixelInjection() {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (pendingPixelInjection) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      // Timeout after 2 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 2000);
    });
  }

  function injectTrackingPixel(dialog, pixelUrl) {
    const bodyField = dialog.querySelector('[contenteditable="true"][role="textbox"]');
    if (!bodyField) return;

    // Add tracking pixel at the end of the email
    const pixel = document.createElement('img');
    pixel.src = pixelUrl;
    pixel.style.cssText = 'width:1px;height:1px;border:0;';
    pixel.alt = '';

    bodyField.appendChild(pixel);
    console.log('VGCMail: Tracking pixel injected');
  }

  function sendEmail(dialog) {
    // Find the real send button and click it
    const sendButton = dialog.querySelector('[data-tooltip*="Send"]');
    if (sendButton) {
      // Trigger the original Gmail send
      sendButton.click();
    }
  }
})();
