// Popup script for VGCMail extension

document.addEventListener('DOMContentLoaded', async () => {
  const status = document.getElementById('status');
  const loginForm = document.getElementById('loginForm');
  const connectedView = document.getElementById('connectedView');
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const disconnectBtn = document.getElementById('disconnectBtn');

  // Load saved settings
  const settings = await chrome.storage.sync.get(['apiKey', 'userEmail']);
  
  if (settings.apiKey) {
    showConnectedView(settings);
  }

  // Save API key
  saveBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      alert('Please enter your API key');
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Connecting...';

    try {
      // Verify API key with backend
      const response = await fetch('https://api.vgcmail.app/api/verify-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey })
      });

      if (response.ok) {
        const data = await response.json();
        
        await chrome.storage.sync.set({
          apiKey: apiKey,
          userEmail: data.email,
          userId: data.userId
        });

        showConnectedView({ apiKey, userEmail: data.email });
      } else {
        alert('Invalid API key. Please check and try again.');
      }
    } catch (error) {
      console.error('Error verifying API key:', error);
      alert('Connection error. Please try again.');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Connect';
    }
  });

  // Disconnect
  disconnectBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to disconnect?')) {
      await chrome.storage.sync.clear();
      location.reload();
    }
  });

  function showConnectedView(settings) {
    status.className = 'status connected';
    status.textContent = `Connected as ${settings.userEmail || 'User'}`;
    loginForm.style.display = 'none';
    connectedView.style.display = 'block';

    // Load stats
    loadStats();
  }

  async function loadStats() {
    try {
      const settings = await chrome.storage.sync.get(['apiKey']);
      const response = await fetch('https://api.vgcmail.app/api/stats', {
        headers: {
          'Authorization': `Bearer ${settings.apiKey}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        document.getElementById('trackedCount').textContent = data.tracked || 0;
        document.getElementById('openCount').textContent = data.opens || 0;
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }
});
