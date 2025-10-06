const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const api = {
  // Stripe checkout
  async createCheckoutSession(priceId, userId, userEmail) {
    const response = await fetch(`${API_URL}/api/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ priceId, userId, userEmail }),
    });
    return response.json();
  },

  // Stripe billing portal
  async createPortalSession(userId) {
    const response = await fetch(`${API_URL}/api/create-portal-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });
    return response.json();
  },

  // Track email
  async trackEmail(userId, emailSubject, recipientEmail) {
    const response = await fetch(`${API_URL}/api/track/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, emailSubject, recipientEmail }),
    });
    return response.json();
  },

  // Create tracked link
  async createTrackedLink(emailId, originalUrl) {
    const response = await fetch(`${API_URL}/api/track/create-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ emailId, originalUrl }),
    });
    return response.json();
  },

  // Get user's tracked emails
  async getTrackedEmails(userId) {
    const response = await fetch(`${API_URL}/api/emails/${userId}`);
    return response.json();
  },

  // Get email details
  async getEmailDetails(emailId) {
    const response = await fetch(`${API_URL}/api/email/${emailId}`);
    return response.json();
  },
};
