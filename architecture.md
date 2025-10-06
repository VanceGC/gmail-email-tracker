# Email Tracker System Architecture

## System Overview

The email tracking system consists of three main components working together to provide comprehensive email tracking capabilities for Gmail users.

### Core Components

**1. Backend Tracking Service (Node.js + Express)**

The backend service serves as the central hub for all tracking operations. It handles the serving of tracking pixels, logging of email opens and link clicks, and provides a RESTful API for the Chrome extension to query tracking data. The service uses SQLite as a lightweight database to store tracking information, including pixel IDs, timestamps, user agents, and IP addresses. When a recipient opens an email, their email client requests the tracking pixel from this service, which logs the event before serving the actual 1x1 transparent PNG image.

**2. Chrome Extension**

The Chrome extension integrates directly into the Gmail interface, providing a seamless user experience. It monitors the Gmail compose window and automatically injects tracking pixels into outgoing emails before they are sent. The extension also wraps all links in the email body with tracking URLs that redirect through the backend service. Additionally, it displays tracking status indicators in the Gmail inbox, showing users which emails have been opened and how many times. The extension communicates with the backend service via API calls to create new tracking pixels and retrieve tracking data.

**3. Web Dashboard**

The web dashboard provides users with a comprehensive view of their email tracking analytics. Users can see a list of all tracked emails, view detailed logs of opens and clicks for each email, and access metrics such as open rates, click-through rates, and engagement patterns. The dashboard is built with EJS templates and served by the same Express backend, ensuring a cohesive user experience.

## Technical Architecture

### Data Flow

**Sending Tracked Email:**

1. User composes email in Gmail
2. Chrome extension detects send action
3. Extension calls backend API to generate unique tracking pixel ID
4. Extension injects tracking pixel HTML into email body
5. Extension wraps all links with tracking redirect URLs
6. Email is sent through Gmail's servers with tracking enabled

**Tracking Email Opens:**

1. Recipient opens email in their email client
2. Email client loads images, requesting tracking pixel from backend
3. Backend logs open event (timestamp, IP, user agent) in database
4. Backend serves 1x1 transparent PNG to email client
5. Chrome extension periodically polls backend API for tracking updates
6. Extension displays open status in Gmail UI

**Tracking Link Clicks:**

1. Recipient clicks link in email
2. Browser navigates to tracking redirect URL on backend
3. Backend logs click event in database
4. Backend immediately redirects to original destination URL
5. User arrives at intended destination with minimal delay

### Database Schema

**Pixels Table:**
- `id` (UUID, primary key)
- `email_subject` (text)
- `recipient_email` (text)
- `created_at` (timestamp)
- `user_id` (text, Gmail address of sender)

**Opens Table:**
- `id` (integer, auto-increment)
- `pixel_id` (UUID, foreign key)
- `opened_at` (timestamp)
- `ip_address` (text)
- `user_agent` (text)

**Links Table:**
- `id` (UUID, primary key)
- `pixel_id` (UUID, foreign key)
- `original_url` (text)
- `created_at` (timestamp)

**Clicks Table:**
- `id` (integer, auto-increment)
- `link_id` (UUID, foreign key)
- `clicked_at` (timestamp)
- `ip_address` (text)
- `user_agent` (text)

## API Endpoints

### Backend REST API

**POST /api/pixels/create**
- Creates new tracking pixel for email
- Request: `{ email_subject, recipient_email, user_id, links: [] }`
- Response: `{ pixel_id, tracking_url, wrapped_links: {} }`

**GET /api/pixels/:user_id**
- Retrieves all tracking pixels for user
- Response: `{ pixels: [] }`

**GET /api/pixels/:pixel_id/stats**
- Retrieves tracking statistics for specific email
- Response: `{ opens: [], clicks: [], total_opens, total_clicks }`

**GET /tracker/:pixel_id.png**
- Serves tracking pixel and logs open event
- Response: 1x1 transparent PNG image

**GET /click/:link_id**
- Logs click event and redirects to original URL
- Query param: `redirect` (original URL)
- Response: 302 redirect

## Security Considerations

**Privacy Protection:**

The system respects user privacy by only tracking emails sent by the user themselves. No third-party email tracking is performed. All tracking data is stored securely and only accessible to the sender. The system does not collect sensitive information beyond basic metadata (timestamps, IP addresses, user agents).

**Data Security:**

All API endpoints require authentication using Gmail OAuth tokens. The Chrome extension securely stores user credentials and passes authentication tokens with each API request. The backend validates these tokens before processing any requests. Database access is restricted to the backend service only.

**CORS and Domain Security:**

The backend implements CORS policies to only accept requests from the Chrome extension and authorized web dashboard domains. This prevents unauthorized access to tracking data from external websites.

## Deployment Strategy

**Backend Service:**

The Node.js backend will be deployed as a containerized application, making it easy to scale and maintain. The service can be deployed on cloud platforms that support Node.js applications, with the SQLite database file persisted in a volume mount for data durability.

**Chrome Extension:**

The Chrome extension will be packaged and distributed through the Chrome Web Store. Users can install it with a single click, and the extension will automatically update when new versions are released. The extension requires permissions to access Gmail and make HTTP requests to the backend service.

**Configuration:**

The backend service URL will be configurable in the extension settings, allowing users to point to their own self-hosted backend or use a shared service. This provides flexibility for different deployment scenarios.

## Limitations and Considerations

**Gmail Image Proxy:**

Modern Gmail uses image proxies (GoogleImageProxy) that cache images and mask recipient IP addresses. This means the system will only reliably detect the first open, and the logged IP address will be Google's proxy server rather than the recipient's actual IP. This is a known limitation of all email tracking systems.

**Image Blocking:**

Some email clients block images by default, preventing tracking pixels from loading. In these cases, opens will not be detected until the recipient explicitly enables images. This is an inherent limitation of pixel-based tracking.

**Privacy Concerns:**

Email tracking can be controversial from a privacy perspective. The system should include clear disclosures to users about how tracking works and provide options to disable tracking on a per-email basis. Recipients should also be informed that emails may contain tracking pixels.

## Future Enhancements

**Real-time Notifications:**

Implement WebSocket connections to provide real-time notifications when emails are opened or links are clicked, rather than requiring the extension to poll the API.

**Advanced Analytics:**

Add more sophisticated analytics features such as heat maps showing which parts of emails receive the most attention, time-of-day analysis for optimal sending times, and A/B testing capabilities.

**Email Templates:**

Provide pre-built email templates with tracking already configured, making it easier for users to send professional tracked emails.

**Integration with CRM Systems:**

Allow tracking data to be exported to popular CRM systems like Salesforce or HubSpot, enabling better sales and marketing workflows.
