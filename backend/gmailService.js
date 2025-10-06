const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

class GmailService {
  constructor(accessToken, refreshToken) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.FRONTEND_URL
    );

    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  /**
   * Get user's sent emails
   */
  async getSentEmails(maxResults = 10) {
    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        labelIds: ['SENT'],
        maxResults: maxResults,
      });

      if (!response.data.messages) {
        return [];
      }

      const emails = await Promise.all(
        response.data.messages.map(async (message) => {
          const detail = await this.gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'full',
          });
          return this.parseEmail(detail.data);
        })
      );

      return emails;
    } catch (error) {
      console.error('Error fetching sent emails:', error);
      throw error;
    }
  }

  /**
   * Parse email data
   */
  parseEmail(message) {
    const headers = message.payload.headers;
    const getHeader = (name) => {
      const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
      return header ? header.value : '';
    };

    return {
      id: message.id,
      threadId: message.threadId,
      subject: getHeader('Subject'),
      to: getHeader('To'),
      from: getHeader('From'),
      date: new Date(parseInt(message.internalDate)),
      snippet: message.snippet,
    };
  }

  /**
   * Watch for new sent emails (Gmail Push Notifications)
   */
  async watchSentEmails(userId) {
    try {
      const response = await this.gmail.users.watch({
        userId: 'me',
        requestBody: {
          labelIds: ['SENT'],
          topicName: `projects/${process.env.GOOGLE_CLOUD_PROJECT_ID}/topics/gmail-notifications`,
        },
      });

      // Store watch info in Supabase
      await supabase
        .from('user_profiles')
        .update({
          gmail_watch_expiration: new Date(parseInt(response.data.expiration)),
          gmail_history_id: response.data.historyId,
        })
        .eq('id', userId);

      return response.data;
    } catch (error) {
      console.error('Error setting up Gmail watch:', error);
      throw error;
    }
  }

  /**
   * Send email with tracking pixel
   */
  async sendTrackedEmail(to, subject, body, userId, trackingId) {
    try {
      // Create tracking pixel URL
      const trackingPixelUrl = `${process.env.FRONTEND_URL}/api/track/open/${trackingId}`;
      
      // Inject tracking pixel into email body
      const trackedBody = `
        ${body}
        <img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" />
      `;

      // Create email message
      const email = [
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `To: ${to}`,
        `Subject: ${subject}`,
        '',
        trackedBody,
      ].join('\n');

      const encodedMessage = Buffer.from(email)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error sending tracked email:', error);
      throw error;
    }
  }

  /**
   * Modify existing email to add tracking (for draft emails)
   */
  async addTrackingToEmail(messageId, trackingId) {
    try {
      // Get the original message
      const message = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'raw',
      });

      // Decode the message
      const rawMessage = Buffer.from(message.data.raw, 'base64').toString('utf-8');
      
      // Add tracking pixel
      const trackingPixelUrl = `${process.env.FRONTEND_URL}/api/track/open/${trackingId}`;
      const trackingPixel = `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" />`;
      
      // Inject tracking pixel before closing body tag
      const modifiedMessage = rawMessage.replace(
        /<\/body>/i,
        `${trackingPixel}</body>`
      );

      // Encode modified message
      const encodedMessage = Buffer.from(modifiedMessage)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // Update the message
      const response = await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          raw: encodedMessage,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error adding tracking to email:', error);
      throw error;
    }
  }
}

module.exports = GmailService;
