# Screenshot Setup Guide

## Quick Setup

1. **Get Screenshot Machine API Key**
   - Sign up at https://screenshotmachine.com/
   - Get your API key from the dashboard

2. **Set Environment Variable**
   ```bash
   # For local development (add to ~/.bashrc or ~/.zshrc)
   export SCREENSHOT_MACHINE_API_KEY="your_api_key_here"
   
   # Or create .env file
   echo "SCREENSHOT_MACHINE_API_KEY=your_api_key_here" >> .env
   ```

3. **For Netlify Deployment**
   - Go to your Netlify site settings
   - Navigate to Environment Variables
   - Add `SCREENSHOT_MACHINE_API_KEY` with your API key

## How It Works

### Automatic Triggers
- **Local**: Screenshots captured after each commit on main/master branch
- **Netlify**: Screenshots captured after successful deployments
- **Manual**: Run `npm run screenshot` or `npm run screenshot:local`

### What Gets Captured
- Homepage (/)
- Portfolio (/portfolio)
- Blog (/blog)
- Tools (/tools)
- About (/about)
- Thoughtful Apps (/thoughtful-app-co)

### Output Location
- **Local**: `screenshots/YYYY-MM-DD-commithash/`
- **Production**: Published to `/screenshots/` on your site

## Testing

```bash
# ⚠️  Note: localhost URLs cannot be captured by Screenshot Machine API
# npm run screenshot:local  # This will show a warning message

# Test with production URL (this works!)
npm run screenshot

# Manual test of post-commit hook
git commit --allow-empty -m "test screenshot capture"
```

### Why localhost doesn't work
Screenshot Machine API is an external service that cannot access your local development server. Screenshots will only work with:
- Production deployments (https://your-site.netlify.app)
- Publicly accessible staging URLs
- Any URL accessible from the internet

## Troubleshooting

### Screenshots Not Capturing
1. Check if `SCREENSHOT_MACHINE_API_KEY` is set
2. Verify API key is valid
3. Check if you're on main/master branch (for git hook)
4. Ensure target URL is accessible

### View Captured Screenshots
```bash
# Local latest screenshots
ls screenshots/latest/

# Check metadata
cat screenshots/latest/metadata.json

# Production screenshots
curl https://your-site.com/screenshots/latest.json
```

## Configuration

Edit `scripts/capture-screenshots.js` to:
- Add/remove pages to capture
- Change screenshot dimensions
- Modify output directory structure
- Adjust rate limiting