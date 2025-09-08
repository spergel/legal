# Cloudflare Worker Deployment Guide

## 🎯 Overview

This guide shows how to deploy your legal events calendar as a Cloudflare Worker with Python. The Worker provides:
- **RSS feed** (`/rss`) for news readers
- **ICS calendar** (`/calendar`) for Google Calendar import
- **JSON API** (`/events`) for programmatic access
- **Weekly cron jobs** for automatic updates

## 🚀 Quick Start

### 1. Install Wrangler CLI
```bash
npm install -g wrangler
```

### 2. Login to Cloudflare
```bash
wrangler login
```

### 3. Deploy the Worker
```bash
wrangler deploy
```

### 4. Test Your Endpoints
Once deployed, test these URLs:
- `https://legal-events-calendar.your-subdomain.workers.dev/rss`
- `https://legal-events-calendar.your-subdomain.workers.dev/calendar`
- `https://legal-events-calendar.your-subdomain.workers.dev/events`

## 📁 Project Structure

```
├── src/
│   └── entry.py          # Main Worker code
├── scrapers/             # Event scrapers (32 scrapers)
├── wrangler.toml         # Cloudflare Worker configuration
├── worker_events.json    # Converted event data
├── sample_rss.xml        # Sample RSS feed
└── sample_calendar.ics   # Sample ICS calendar
```

## 🔧 Configuration

### wrangler.toml
```toml
name = "legal-events-calendar"
main = "src/entry.py"
compatibility_flags = ["python_workers"]
compatibility_date = "2024-03-20"

[triggers]
crons = ["0 6 * * 1"]  # Run every Monday at 6 AM UTC

[vars]
ENVIRONMENT = "production"
```

## 📅 Available Endpoints

### 1. RSS Feed
**URL:** `/rss`
**Content-Type:** `application/rss+xml`
**Use Case:** News readers, RSS aggregators

### 2. ICS Calendar
**URL:** `/calendar`
**Content-Type:** `text/calendar`
**Use Case:** Google Calendar import, calendar apps

### 3. JSON API
**URL:** `/events`
**Content-Type:** `application/json`
**Use Case:** Programmatic access, custom integrations

### 4. Health Check
**URL:** `/health`
**Content-Type:** `application/json`
**Use Case:** Monitoring, uptime checks

## 🎨 Squarespace Integration

### Method 1: RSS Feed
1. In Squarespace, add a "RSS" block
2. Enter your RSS URL: `https://your-worker.workers.dev/rss`
3. Configure display options

### Method 2: Google Calendar (Recommended)
1. **Import ICS to Google Calendar:**
   - Go to [calendar.google.com](https://calendar.google.com)
   - Click "+" → "Create new calendar"
   - Name: "NYC Legal Events"
   - Go to Settings → "Import & export"
   - Use URL: `https://your-worker.workers.dev/calendar`

2. **Embed in Squarespace:**
   - In Google Calendar settings → "Integrate calendar"
   - Copy the embed code
   - In Squarespace, add a "Code" block
   - Paste the embed code

## 🔄 Automated Updates

### Cron Triggers
The Worker runs automatically every Monday at 6 AM UTC to:
- Scrape fresh events from all sources
- Update the calendar feeds
- Cache the latest data

### Manual Updates
You can also trigger updates manually:
```bash
wrangler dev  # Test locally
wrangler deploy  # Deploy updates
```

## 🧪 Testing

### Local Development
```bash
# Start local development server
wrangler dev

# Test endpoints locally
curl http://localhost:8787/rss
curl http://localhost:8787/calendar
curl http://localhost:8787/events
```

### Production Testing
```bash
# Test deployed endpoints
curl https://your-worker.workers.dev/rss
curl https://your-worker.workers.dev/calendar
curl https://your-worker.workers.dev/events
```

## 📊 Monitoring

### Cloudflare Dashboard
- View Worker logs and metrics
- Monitor cron job execution
- Check error rates and performance

### Health Check
```bash
curl https://your-worker.workers.dev/health
```

## 🔧 Customization

### Adding More Scrapers
1. Add new scraper files to `scrapers/` directory
2. Update the cron job to run your scrapers
3. Redeploy the Worker

### Modifying Event Data
1. Edit `worker_events.json`
2. Run `python populate_worker_data.py` to regenerate
3. Redeploy the Worker

### Changing Cron Schedule
Edit `wrangler.toml`:
```toml
[triggers]
crons = ["0 6 * * 1"]  # Every Monday at 6 AM UTC
# crons = ["0 6 * * *"]  # Every day at 6 AM UTC
# crons = ["0 6 1 * *"]  # First day of every month at 6 AM UTC
```

## 🚀 Deployment Commands

```bash
# Deploy to production
wrangler deploy

# Deploy to preview
wrangler deploy --env preview

# View logs
wrangler tail

# Delete worker
wrangler delete
```

## 🎉 Benefits of Cloudflare Workers

✅ **Fast Global CDN** - Served from 200+ locations worldwide  
✅ **Automatic Scaling** - Handles any traffic load  
✅ **Cron Jobs** - Built-in scheduled tasks  
✅ **Python Support** - Native Python runtime  
✅ **Free Tier** - 100,000 requests/day free  
✅ **No Server Management** - Fully serverless  
✅ **Edge Computing** - Runs close to users  

## 📱 Mobile & Cross-Platform

- **RSS feeds** work in all news readers
- **ICS calendars** work in all calendar apps
- **JSON API** works with any programming language
- **Automatic updates** keep everything in sync

## 🔗 Integration Examples

### WordPress
```php
// Add to functions.php
function get_legal_events() {
    $response = wp_remote_get('https://your-worker.workers.dev/events');
    return json_decode(wp_remote_retrieve_body($response), true);
}
```

### React/Next.js
```javascript
// Fetch events
const response = await fetch('https://your-worker.workers.dev/events');
const data = await response.json();
```

### Squarespace Code Block
```html
<script>
fetch('https://your-worker.workers.dev/events')
  .then(response => response.json())
  .then(data => {
    // Display events
    console.log(data.data);
  });
</script>
```

Your legal events calendar is now ready for Squarespace integration! 🚀


