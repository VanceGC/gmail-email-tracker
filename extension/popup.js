// Load settings and stats when popup opens
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadStats();
  checkStatus();
});

// Save settings button
document.getElementById('saveBtn').addEventListener('click', async () => {
  const backendUrl = document.getElementById('backendUrl').value.trim();
  const userEmail = document.getElementById('userEmail').value.trim();
  const autoTrack = document.getElementById('autoTrack').checked;
  
  if (!backendUrl) {
    showError('Please enter a backend server URL');
    return;
  }
  
  if (!userEmail) {
    showError('Please enter your Gmail address');
    return;
  }
  
  // Validate URL format
  try {
    new URL(backendUrl);
  } catch (e) {
    showError('Please enter a valid URL (e.g., http://localhost:3000)');
    return;
  }
  
  // Save to Chrome storage
  await chrome.storage.sync.set({
    backendUrl,
    userEmail,
    autoTrack
  });
  
  showSuccess('Settings saved successfully!');
  checkStatus();
});

// Open dashboard button
document.getElementById('dashboardBtn').addEventListener('click', async () => {
  const { backendUrl, userEmail } = await chrome.storage.sync.get(['backendUrl', 'userEmail']);
  
  if (!backendUrl) {
    showError('Please configure backend URL first');
    return;
  }
  
  const dashboardUrl = `${backendUrl}/?user_id=${encodeURIComponent(userEmail || 'demo@example.com')}`;
  chrome.tabs.create({ url: dashboardUrl });
});

// Load settings from storage
async function loadSettings() {
  const settings = await chrome.storage.sync.get(['backendUrl', 'userEmail', 'autoTrack']);
  
  document.getElementById('backendUrl').value = settings.backendUrl || 'http://localhost:3000';
  document.getElementById('userEmail').value = settings.userEmail || '';
  document.getElementById('autoTrack').checked = settings.autoTrack !== false;
}

// Load statistics
async function loadStats() {
  try {
    const { backendUrl, userEmail } = await chrome.storage.sync.get(['backendUrl', 'userEmail']);
    
    if (!backendUrl || !userEmail) {
      return;
    }
    
    const response = await fetch(`${backendUrl}/api/pixels/${encodeURIComponent(userEmail)}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }
    
    const data = await response.json();
    const pixels = data.pixels || [];
    
    const totalTracked = pixels.length;
    const totalOpens = pixels.reduce((sum, p) => sum + (parseInt(p.open_count) || 0), 0);
    
    document.getElementById('totalTracked').textContent = totalTracked;
    document.getElementById('totalOpens').textContent = totalOpens;
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// Check backend connection status
async function checkStatus() {
  const statusIndicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');
  
  try {
    const { backendUrl } = await chrome.storage.sync.get(['backendUrl']);
    
    if (!backendUrl) {
      statusIndicator.classList.add('inactive');
      statusText.textContent = 'Not configured';
      return;
    }
    
    const response = await fetch(`${backendUrl}/`, { method: 'HEAD' });
    
    if (response.ok) {
      statusIndicator.classList.remove('inactive');
      statusText.textContent = 'Connected to backend';
    } else {
      statusIndicator.classList.add('inactive');
      statusText.textContent = 'Backend not responding';
    }
  } catch (error) {
    statusIndicator.classList.add('inactive');
    statusText.textContent = 'Cannot connect to backend';
  }
}

// Show success message
function showSuccess(message) {
  const successEl = document.getElementById('successMessage');
  successEl.textContent = message;
  successEl.style.display = 'block';
  
  setTimeout(() => {
    successEl.style.display = 'none';
  }, 3000);
}

// Show error message
function showError(message) {
  const errorEl = document.getElementById('errorMessage');
  errorEl.textContent = message;
  errorEl.style.display = 'block';
  
  setTimeout(() => {
    errorEl.style.display = 'none';
  }, 3000);
}
