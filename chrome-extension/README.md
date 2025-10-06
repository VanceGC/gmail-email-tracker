# VGCMail Chrome Extension

Email tracking extension for Gmail that integrates with VGCMail.app

## Features

- 📧 **Track Email Opens** - Know when recipients open your emails
- 🔗 **Track Link Clicks** - See which links get clicked
- 🎯 **Gmail Integration** - Works seamlessly within Gmail
- 🔒 **Privacy Focused** - Your data stays on your server
- ⚡ **Real-time Tracking** - Instant notifications

## Installation

### For Development/Testing

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `vgcmail-chrome-extension` folder
5. The extension icon should appear in your toolbar

### Configuration

1. Click the VGCMail extension icon
2. Enter your API key (get it from https://vgcmail.app/dashboard)
3. Click "Connect"
4. You're ready to track emails!

## How to Use

1. **Compose an email** in Gmail as usual
2. **Look for the tracking indicator** - You'll see "📧 Tracking enabled" in the compose window
3. **Toggle tracking** - Click the indicator to enable/disable tracking for this email
4. **Send your email** - The tracking pixel is automatically injected
5. **View stats** - Check your dashboard at https://vgcmail.app/dashboard

## How It Works

1. **Compose Detection** - Extension detects when you're composing an email
2. **Pixel Injection** - Adds an invisible 1x1 pixel image to your email
3. **Link Wrapping** - Wraps links with tracking URLs (coming soon)
4. **Open Tracking** - When recipient opens email, pixel loads and records the open
5. **Dashboard Updates** - View all tracking data in real-time on your dashboard

## Privacy & Security

- **No data collection** - We only track what you explicitly choose to track
- **Your infrastructure** - All data stored on your VGCMail server
- **Transparent** - Open source code you can audit
- **GDPR compliant** - Respects user privacy

## Troubleshooting

### Extension not working?
1. Make sure you're logged into Gmail
2. Refresh the Gmail tab
3. Check that the extension is enabled in `chrome://extensions/`
4. Verify your API key is correct

### Tracking pixel not injecting?
1. Make sure tracking is enabled (green indicator)
2. Check browser console for errors (F12)
3. Verify you're connected (click extension icon)

### Can't see tracked emails?
1. Go to https://vgcmail.app/dashboard
2. Make sure you're logged in with the same account
3. Click "Sync Gmail" to refresh

## Support

- **Website:** https://vgcmail.app
- **Dashboard:** https://vgcmail.app/dashboard
- **Documentation:** https://github.com/VanceGC/gmail-email-tracker

## Version History

### 1.0.0 (Current)
- Initial release
- Gmail compose integration
- Email open tracking
- Dashboard statistics
- API key authentication

## License

MIT License - See LICENSE file for details
