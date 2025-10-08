(function() {
  'use strict';

  console.log('VGCMail Gmail integration v2 active');

  // Create Trusted Types policy for safe HTML
  let trustedHTMLPolicy;
  if (window.trustedTypes && trustedTypes.createPolicy) {
    try {
      trustedHTMLPolicy = trustedTypes.createPolicy('vgcmail-html', {
        createHTML: (string) => string
      });
    } catch (e) {
      console.warn('VGCMail: Could not create Trusted Types policy:', e);
    }
  }

  // Safe innerHTML setter
  function safeSetInnerHTML(element, html) {
    if (trustedHTMLPolicy) {
      element.innerHTML = trustedHTMLPolicy.createHTML(html);
    } else {
      element.innerHTML = html;
    }
  }

  let composeWindows = new Map();
  let apiKey = null;
  let userId = null;
  let settingsReceived = false;
  let settingsRequested = false;

  // Request settings
  function requestSettings() {
    if (!settingsRequested) {
      console.log('VGCMail: Requesting settings from content script');
      window.postMessage({ type: 'VGCMAIL_GET_SETTINGS' }, '*');
      settingsRequested = true;
    }
  }

  // Request settings immediately
  requestSettings();

  // Listen for settings response
  window.addEventListener('message', (event) => {
    if (event.data.type === 'VGCMAIL_SETTINGS_RESPONSE') {
      apiKey = event.data.payload.apiKey;
      userId = event.data.payload.userId;
      settingsReceived = true;
      console.log('VGCMail: Settings received', { hasApiKey: !!apiKey, userId });
      
      if (!apiKey) {
        console.warn('VGCMail: No API key found. Please connect the extension.');
      }
      
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
    safeSetInnerHTML(toggle, '<span style="margin-right: 4px;">✓</span> Tracking ON');
    
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
      safeSetInnerHTML(toggle, newState ? '<span style="margin-right: 4px;">✓</span> Tracking ON' : '<span style="margin-right: 4px;">✗</span> Tracking OFF');
      
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
      safeSetInnerHTML(toggle, '<span style="margin-right: 4px;">⚠</span> Not Connected');
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

    // Create tracking record via content script (to bypass CSP)
    try {
      // Send message to content script to make API call
      window.postMessage({
        type: 'VGCMAIL_CREATE_TRACKING',
        payload: {
          trackingId: trackingId,
          subject: subject,
          recipient: recipient,
          apiKey: apiKey
        }
      }, '*');

      // Wait for response
      const responsePromise = new Promise((resolve, reject) => {
        const handler = (event) => {
          if (event.data.type === 'VGCMAIL_TRACKING_CREATED') {
            window.removeEventListener('message', handler);
            resolve(event.data.payload);
          } else if (event.data.type === 'VGCMAIL_TRACKING_ERROR') {
            window.removeEventListener('message', handler);
            reject(new Error(event.data.payload.error));
          }
        };
        window.addEventListener('message', handler);
        
        // Timeout after 10 seconds
        setTimeout(() => {
          window.removeEventListener('message', handler);
          reject(new Error('Timeout waiting for tracking response'));
        }, 10000);
      });

      const result = await responsePromise;
      console.log('VGCMail: Tracking created successfully', result);
      
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
    console.log('VGCMail: Extracting recipient...');
    
    // Strategy 1: Look for email chips/bubbles with email attribute
    const emailChips = composeEl.querySelectorAll('[email]');
    console.log('VGCMail: Found email chips:', emailChips.length);
    for (const chip of emailChips) {
      const email = chip.getAttribute('email');
      if (email && email.includes('@')) {
        console.log('VGCMail: Found recipient via email attribute:', email);
        return email;
      }
    }
    
    // Strategy 2: Look for data-hovercard-id
    const hovercards = composeEl.querySelectorAll('[data-hovercard-id]');
    console.log('VGCMail: Found hovercards:', hovercards.length);
    for (const card of hovercards) {
      const email = card.getAttribute('data-hovercard-id');
      if (email && email.includes('@')) {
        console.log('VGCMail: Found recipient via hovercard:', email);
        return email;
      }
    }
    
    // Strategy 3: Look for span with email class in To field
    const toField = composeEl.querySelector('.vR, [aria-label*="To" i], .aoD.hl');
    if (toField) {
      console.log('VGCMail: Found To field, searching for email...');
      
      // Look for spans with email addresses
      const spans = toField.querySelectorAll('span');
      for (const span of spans) {
        const text = span.textContent || span.innerText;
        const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
        if (emailMatch) {
          console.log('VGCMail: Found recipient in span:', emailMatch[0]);
          return emailMatch[0];
        }
      }
      
      // Search entire To field text
      const emailMatch = toField.textContent.match(/[\w.-]+@[\w.-]+\.\w+/);
      if (emailMatch) {
        console.log('VGCMail: Found recipient in To field text:', emailMatch[0]);
        return emailMatch[0];
      }
    } else {
      console.log('VGCMail: Could not find To field');
    }
    
    // Strategy 4: Look for input field
    const toInput = composeEl.querySelector('input[aria-label*="To" i], .vR input, input[name="to"]');
    if (toInput && toInput.value) {
      console.log('VGCMail: Found To input with value:', toInput.value);
      const emailMatch = toInput.value.match(/[\w.-]+@[\w.-]+\.\w+/);
      if (emailMatch) {
        console.log('VGCMail: Found recipient in input:', emailMatch[0]);
        return emailMatch[0];
      }
    }
    
    // Strategy 5: Look for any element with email pattern in compose window
    const allText = composeEl.textContent;
    const emailMatches = allText.match(/[\w.-]+@[\w.-]+\.\w+/g);
    if (emailMatches && emailMatches.length > 0) {
      // Filter out common false positives
      const validEmails = emailMatches.filter(email => 
        !email.includes('example.com') && 
        !email.includes('test.com') &&
        !email.includes('vgcmail.app')
      );
      if (validEmails.length > 0) {
        console.log('VGCMail: Found recipient via text search:', validEmails[0]);
        return validEmails[0];
      }
    }
    
    console.log('VGCMail: No recipient found with any strategy');
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
