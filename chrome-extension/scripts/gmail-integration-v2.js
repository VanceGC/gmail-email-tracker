(function() {
  'use strict';

  console.log('VGCMail Gmail integration v2 active');

  let composeWindows = new Map();
  let apiKey = null;
  let userId = null;
  let settingsReceived = false;

  // Get API key from extension storage
  window.postMessage({ type: 'VGCMAIL_GET_SETTINGS' }, '*');

  // Listen for settings response
  window.addEventListener('message', (event) => {
    if (event.data.type === 'VGCMAIL_SETTINGS_RESPONSE') {
      apiKey = event.data.payload.apiKey;
      userId = event.data.payload.userId;
      settingsReceived = true;
      console.log('VGCMail: Settings received', { hasApiKey: !!apiKey, userId });
      
      // Check for compose windows now that we have settings
      checkForComposeWindows();
    }
  });

  // Observe for Gmail compose windows with multiple strategies
  const observer = new MutationObserver(() => {
    checkForComposeWindows();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Initial check after a delay
  setTimeout(() => {
    checkForComposeWindows();
  }, 2000);

  // Periodic check every 3 seconds
  setInterval(() => {
    checkForComposeWindows();
  }, 3000);

  function checkForComposeWindows() {
    // Multiple selectors for different Gmail layouts
    const selectors = [
      '.M9',  // Standard compose
      'div[role="dialog"][aria-label*="compose" i]',
      'div[role="dialog"][aria-label*="reply" i]',
      'div[role="dialog"][aria-label*="forward" i]',
      '.nH.aHU',  // Alternative compose container
      'div.AD',  // Another compose class
    ];
    
    const composeElements = document.querySelectorAll(selectors.join(', '));
    
    composeElements.forEach((composeEl) => {
      // Verify it's actually a compose window by checking for common elements
      const hasSubject = composeEl.querySelector('input[name="subjectbox"], [aria-label*="Subject" i]');
      const hasBody = composeEl.querySelector('div[contenteditable="true"][role="textbox"], [aria-label*="Message" i][contenteditable="true"]');
      
      if (!hasSubject && !hasBody) {
        return; // Not a compose window
      }
      
      const composeId = getComposeId(composeEl);
      
      if (!composeWindows.has(composeId)) {
        console.log('VGCMail: Found new compose window', composeId);
        composeWindows.set(composeId, composeEl);
        initializeComposeWindow(composeEl, composeId);
      }
    });

    // Clean up closed compose windows
    composeWindows.forEach((el, id) => {
      if (!document.body.contains(el)) {
        console.log('VGCMail: Compose window closed', id);
        composeWindows.delete(id);
      }
    });
  }

  function getComposeId(element) {
    if (element.id) return element.id;
    
    // Try to find a stable identifier
    const subjectField = element.querySelector('input[name="subjectbox"]');
    if (subjectField && subjectField.name) {
      return `compose_${subjectField.name}_${element.getBoundingClientRect().top}`;
    }
    
    const allComposes = Array.from(document.querySelectorAll('.M9, div[role="dialog"]'));
    const index = allComposes.indexOf(element);
    return `compose_${index}_${Date.now()}`;
  }

  function initializeComposeWindow(composeEl, composeId) {
    // Wait a bit for the compose window to fully render
    setTimeout(() => {
      addTrackingToggle(composeEl, composeId);
      monitorCompose(composeEl, composeId);
    }, 500);
  }

  function addTrackingToggle(composeEl, composeId) {
    // Try multiple toolbar selectors
    const toolbarSelectors = [
      '.gU',  // Format toolbar
      '.btC',  // Bottom toolbar
      '[role="toolbar"]',
      '.aDh',  // Alternative toolbar
      '.wO',  // Send button container
    ];
    
    let toolbar = null;
    for (const selector of toolbarSelectors) {
      toolbar = composeEl.querySelector(selector);
      if (toolbar) break;
    }
    
    if (!toolbar) {
      console.log('VGCMail: Could not find toolbar, trying alternative placement');
      // Try to find the send button and place near it
      const sendButton = composeEl.querySelector('[data-tooltip*="Send" i], button[aria-label*="Send" i]');
      if (sendButton && sendButton.parentElement) {
        toolbar = sendButton.parentElement;
      }
    }
    
    if (!toolbar) {
      console.error('VGCMail: Could not find toolbar for compose', composeId);
      return;
    }
    
    if (toolbar.querySelector('.vgcmail-toggle')) {
      console.log('VGCMail: Toggle already exists');
      return;
    }

    const toggle = document.createElement('div');
    toggle.className = 'vgcmail-toggle';
    toggle.setAttribute('data-compose-id', composeId);
    toggle.setAttribute('data-tracking-enabled', 'true');
    toggle.style.cssText = `
      display: inline-flex;
      align-items: center;
      padding: 8px 14px;
      margin: 4px;
      background: #10b981;
      color: white;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      user-select: none;
      transition: all 0.2s;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      z-index: 1000;
      position: relative;
    `;
    toggle.innerHTML = '<span style="margin-right: 4px;">✓</span> Tracking ON';
    
    toggle.addEventListener('mouseenter', () => {
      toggle.style.transform = 'translateY(-1px)';
      toggle.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
    });
    
    toggle.addEventListener('mouseleave', () => {
      toggle.style.transform = 'translateY(0)';
      toggle.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    });
    
    toggle.addEventListener('click', () => {
      const isEnabled = toggle.getAttribute('data-tracking-enabled') === 'true';
      const newState = !isEnabled;
      
      toggle.setAttribute('data-tracking-enabled', newState.toString());
      toggle.style.background = newState ? '#10b981' : '#6b7280';
      toggle.innerHTML = newState ? '<span style="margin-right: 4px;">✓</span> Tracking ON' : '<span style="margin-right: 4px;">✗</span> Tracking OFF';
      
      if (newState) {
        injectTrackingPixel(composeEl, composeId);
      } else {
        removeTrackingPixel(composeEl);
      }
      
      console.log(`VGCMail: Tracking ${newState ? 'enabled' : 'disabled'} for compose ${composeId}`);
    });

    // Insert at the beginning
    toolbar.insertBefore(toggle, toolbar.firstChild);
    console.log('VGCMail: Added tracking toggle to compose', composeId);
    
    // Show notification if no API key
    if (!apiKey && settingsReceived) {
      toggle.style.background = '#ef4444';
      toggle.innerHTML = '<span style="margin-right: 4px;">⚠</span> Not Connected';
      toggle.title = 'Click the extension icon to connect your account';
      toggle.style.cursor = 'not-allowed';
      return;
    }
    
    // Inject pixel after a delay
    setTimeout(() => {
      if (toggle.getAttribute('data-tracking-enabled') === 'true') {
        injectTrackingPixel(composeEl, composeId);
      }
    }, 1000);
  }

  function monitorCompose(composeEl, composeId) {
    const toField = composeEl.querySelector('.vR, [aria-label*="To" i]');
    if (!toField) return;
    
    const observer = new MutationObserver(() => {
      const toggle = composeEl.querySelector('.vgcmail-toggle');
      if (toggle && toggle.getAttribute('data-tracking-enabled') === 'true') {
        updateTrackingPixel(composeEl, composeId);
      }
    });

    observer.observe(toField, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  async function injectTrackingPixel(composeEl, composeId) {
    if (!apiKey) {
      console.log('VGCMail: No API key, skipping tracking');
      return;
    }

    const bodyField = composeEl.querySelector('div[contenteditable="true"][role="textbox"], [aria-label*="Message" i][contenteditable="true"]');
    if (!bodyField) {
      console.error('VGCMail: Could not find body field');
      return;
    }

    // Check if pixel already exists
    if (bodyField.querySelector('img[data-vgcmail-pixel]')) {
      console.log('VGCMail: Pixel already exists');
      return;
    }

    // Extract recipient
    const recipient = extractRecipient(composeEl);
    if (!recipient) {
      console.log('VGCMail: No recipient yet, will try again');
      return;
    }

    // Extract subject
    const subjectField = composeEl.querySelector('input[name="subjectbox"], [aria-label*="Subject" i]');
    const subject = subjectField ? subjectField.value : '(No Subject)';

    // Generate tracking ID
    const trackingId = generateTrackingId();
    const pixelUrl = `https://api.vgcmail.app/api/track/open/${trackingId}`;

    console.log('VGCMail: Creating tracking', { trackingId, recipient, subject });

    // Create tracking record
    try {
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
        console.log('VGCMail: Tracking created successfully');
        
        // Create and inject pixel
        const pixel = document.createElement('img');
        pixel.src = pixelUrl;
        pixel.setAttribute('data-vgcmail-pixel', 'true');
        pixel.setAttribute('data-tracking-id', trackingId);
        pixel.style.cssText = 'width:1px;height:1px;border:0;display:none;';
        pixel.alt = '';
        pixel.width = 1;
        pixel.height = 1;

        // Append to end of body
        bodyField.appendChild(pixel);
        console.log('VGCMail: Pixel injected');
      } else {
        const errorData = await response.json();
        console.error('VGCMail: Failed to create tracking:', response.status, errorData);
      }
    } catch (error) {
      console.error('VGCMail: Error creating tracking:', error);
    }
  }

  function updateTrackingPixel(composeEl, composeId) {
    const bodyField = composeEl.querySelector('div[contenteditable="true"][role="textbox"], [aria-label*="Message" i][contenteditable="true"]');
    const existingPixel = bodyField?.querySelector('img[data-vgcmail-pixel]');
    
    if (!existingPixel) {
      injectTrackingPixel(composeEl, composeId);
    }
  }

  function removeTrackingPixel(composeEl) {
    const bodyField = composeEl.querySelector('div[contenteditable="true"][role="textbox"], [aria-label*="Message" i][contenteditable="true"]');
    const pixel = bodyField?.querySelector('img[data-vgcmail-pixel]');
    
    if (pixel) {
      pixel.remove();
      console.log('VGCMail: Pixel removed');
    }
  }

  function extractRecipient(composeEl) {
    // Strategy 1: Look for email chips/bubbles with email attribute
    const emailChips = composeEl.querySelectorAll('[email]');
    for (const chip of emailChips) {
      const email = chip.getAttribute('email');
      if (email && email.includes('@')) {
        return email;
      }
    }
    
    // Strategy 2: Look for data-hovercard-id
    const hovercards = composeEl.querySelectorAll('[data-hovercard-id]');
    for (const card of hovercards) {
      const email = card.getAttribute('data-hovercard-id');
      if (email && email.includes('@')) {
        return email;
      }
    }
    
    // Strategy 3: Look in To field container
    const toContainer = composeEl.querySelector('.vR, [aria-label*="To" i]');
    if (toContainer) {
      const emailMatch = toContainer.textContent.match(/[\w.-]+@[\w.-]+\.\w+/);
      if (emailMatch) return emailMatch[0];
    }
    
    // Strategy 4: Look for input field
    const toInput = composeEl.querySelector('input[aria-label*="To" i], .vR input');
    if (toInput && toInput.value) {
      const emailMatch = toInput.value.match(/[\w.-]+@[\w.-]+\.\w+/);
      if (emailMatch) return emailMatch[0];
    }
    
    return null;
  }

  function generateTrackingId() {
    // Generate a UUID-like tracking ID
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  console.log('VGCMail: Gmail integration initialized');

})();
