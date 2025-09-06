# Squarespace Integration Guide

This guide explains how to integrate your Next.js legal events platform with Squarespace for content management and publishing.

## 🎯 Overview

The integration allows you to:
- **Pull events** from your Next.js backend into Squarespace
- **Submit events** from Squarespace back to your backend
- **Manage events** through Squarespace's intuitive interface
- **Publish events** as Squarespace blog posts or custom content

## 🔗 API Endpoints (Same as WordPress)

Your existing API endpoints work perfectly with Squarespace:

### 1. RSS Feed
**URL:** `https://lawyerevents.net/api/events/rss`

**Parameters:**
- `limit` (optional): Number of events to fetch (default: 50, max: 100)
- `status` (optional): Event status filter (default: "approved,featured")
- `community` (optional): Filter by community name

### 2. REST API
**URL:** `https://lawyerevents.net/api/events/wordpress` (works for Squarespace too!)

**GET Request** - Fetch events as JSON:
```javascript
fetch('https://lawyerevents.net/api/events/wordpress?limit=20&status=approved,featured')
  .then(response => response.json())
  .then(data => console.log(data));
```

**POST Request** - Submit new event:
```javascript
fetch('https://lawyerevents.net/api/events/wordpress', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Legal Networking Event',
    description: 'Join us for networking...',
    start_date: '2024-02-15T18:00:00Z',
    end_date: '2024-02-15T20:00:00Z',
    location_name: 'NYC Bar Association',
    location_address: '42 W 44th St, New York, NY',
    community_name: 'NYC Bar',
    contact_email: 'events@nycbar.org',
    photo_url: 'https://example.com/event-photo.jpg',
    wordpress_id: 'squarespace-123' // Use Squarespace post ID
  })
});
```

## 🛠 Squarespace Setup

### Step 1: Create Squarespace Site

1. **Sign up** at [squarespace.com](https://squarespace.com)
2. **Choose a template** (recommend "Bedford" or "Five" for event sites)
3. **Set up your domain** (or use squarespace subdomain initially)

### Step 2: Set Up Event Content Structure

#### Option A: Blog Posts (Recommended)
1. **Create a blog** called "Legal Events"
2. **Set up categories** for event types (CLE, Networking, etc.)
3. **Use blog post format** for each event

#### Option B: Custom Content Blocks
1. **Create a page** for each event
2. **Use custom fields** in page settings
3. **More flexible** but requires more setup

### Step 3: Squarespace Developer Platform (Advanced)

For full API integration, you'll need:

1. **Squarespace Developer Account**
2. **Developer Platform access**
3. **Custom code injection** capabilities

## 🔧 Integration Methods

### Method 1: RSS Import (Easiest)

1. **Go to Settings** → **Connected Accounts**
2. **Add RSS Feed** connection
3. **Enter your RSS URL**: `https://lawyerevents.net/api/events/rss`
4. **Configure import settings**:
   - Import frequency: Every hour
   - Post type: Blog posts
   - Category: Legal Events

### Method 2: Code Injection (More Control)

Add this JavaScript to your Squarespace site:

```javascript
// Add to Settings → Advanced → Code Injection → Footer

<script>
// Fetch events from your Next.js backend
async function fetchEvents() {
  try {
    const response = await fetch('https://lawyerevents.net/api/events/wordpress?limit=20&status=approved,featured');
    const data = await response.json();
    
    if (data.success) {
      displayEvents(data.data);
    }
  } catch (error) {
    console.error('Error fetching events:', error);
  }
}

// Display events on your site
function displayEvents(events) {
  const container = document.getElementById('events-container');
  if (!container) return;
  
  container.innerHTML = events.map(event => `
    <div class="event-card">
      <h3>${event.title}</h3>
      <p class="event-date">${new Date(event.start_date).toLocaleDateString()}</p>
      <p class="event-location">${event.location?.name || 'TBD'}</p>
      <p class="event-description">${event.excerpt}</p>
      <a href="${event.url}" class="event-link">Learn More</a>
    </div>
  `).join('');
}

// Load events when page loads
document.addEventListener('DOMContentLoaded', fetchEvents);
</script>
```

### Method 3: Squarespace API (Most Advanced)

If you have Developer Platform access:

```javascript
// Squarespace API integration
const SQUARESPACE_API_KEY = 'your-api-key';
const SITE_ID = 'your-site-id';

// Create event post in Squarespace
async function createSquarespaceEvent(eventData) {
  const response = await fetch(`https://api.squarespace.com/1.0/sites/${SITE_ID}/blog/posts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SQUARESPACE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: eventData.title,
      body: eventData.description,
      excerpt: eventData.excerpt,
      tags: ['legal-events', eventData.community?.name],
      publishOn: new Date().toISOString()
    })
  });
  
  return response.json();
}

// Submit event to your Next.js backend
async function submitEventToBackend(squarespacePostId, eventData) {
  const response = await fetch('https://lawyerevents.net/api/events/wordpress', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...eventData,
      wordpress_id: `squarespace-${squarespacePostId}`
    })
  });
  
  return response.json();
}
```

## 🎨 Squarespace Styling

### Custom CSS for Events

Add to **Settings** → **Advanced** → **Code Injection** → **Header**:

```css
<style>
.event-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.event-card h3 {
  color: #333;
  margin-bottom: 10px;
  font-size: 1.5em;
}

.event-date {
  color: #666;
  font-weight: bold;
  margin-bottom: 5px;
}

.event-location {
  color: #888;
  margin-bottom: 10px;
}

.event-description {
  color: #555;
  line-height: 1.6;
  margin-bottom: 15px;
}

.event-link {
  display: inline-block;
  background: #007acc;
  color: white;
  padding: 10px 20px;
  text-decoration: none;
  border-radius: 4px;
  transition: background 0.3s;
}

.event-link:hover {
  background: #005a9e;
}

.events-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}
</style>
```

## 🔄 Workflow Options

### Option 1: Squarespace as Primary CMS
1. **Create events in Squarespace** → Auto-submit to Next.js backend
2. **Manage events in Squarespace** → Sync to backend
3. **Display events on Squarespace** → Pull from backend for consistency

### Option 2: Next.js as Primary Source
1. **Create events in Next.js admin** → Auto-sync to Squarespace
2. **Squarespace displays events** → Pull from Next.js RSS/API
3. **Squarespace can submit new events** → Back to Next.js for approval

### Option 3: Bidirectional Sync
1. **Events created anywhere** → Sync to both systems
2. **Changes in either system** → Update the other
3. **Single source of truth** → Next.js backend database

## 🚀 Implementation Steps

### Quick Start (RSS Method)
1. **Set up Squarespace site**
2. **Add RSS feed connection** in Connected Accounts
3. **Configure import settings**
4. **Test with a few events**

### Advanced Setup (Code Injection)
1. **Set up Squarespace site**
2. **Add custom code** to Code Injection
3. **Create events container** on your pages
4. **Test API integration**

### Full Integration (Developer Platform)
1. **Get Developer Platform access**
2. **Set up API keys**
3. **Implement bidirectional sync**
4. **Test full workflow**

## 📊 Benefits of Squarespace Integration

✅ **Beautiful Templates** - Professional, mobile-responsive designs  
✅ **Easy Content Management** - Intuitive interface for non-technical users  
✅ **Built-in SEO** - Automatic SEO optimization  
✅ **E-commerce Ready** - Sell event tickets if needed  
✅ **Analytics Integration** - Built-in Google Analytics  
✅ **Form Builder** - Easy event submission forms  
✅ **Email Marketing** - Built-in newsletter tools  
✅ **No Maintenance** - Squarespace handles hosting and updates  

## 🔧 Squarespace-Specific Features

### Event Submission Form
Create a custom form in Squarespace:
1. **Add Form Block** to any page
2. **Configure fields**:
   - Event Title (Text)
   - Description (Textarea)
   - Date (Date)
   - Location (Text)
   - Contact Email (Email)
3. **Set up form action** to submit to your API

### Event Calendar Integration
1. **Use Squarespace Calendar Block**
2. **Import events** via RSS or API
3. **Display in calendar format**

### Newsletter Integration
1. **Use Squarespace Email Campaigns**
2. **Import subscriber list** from your Next.js backend
3. **Send event newsletters** directly from Squarespace

## 🔗 Next Steps

1. **Choose your integration method** (RSS, Code Injection, or Developer Platform)
2. **Set up Squarespace site** with your chosen template
3. **Test the API endpoints** with your existing events
4. **Implement the integration** using the provided code
5. **Customize the design** to match your brand
6. **Set up automated sync** for production use

## 💡 Pro Tips

- **Start with RSS import** - it's the easiest way to get started
- **Use Squarespace's built-in forms** for event submissions
- **Leverage Squarespace's SEO tools** for better search rankings
- **Consider Squarespace's e-commerce** for paid events
- **Use their email marketing** for event promotion

This integration gives you the best of both worlds - the powerful event management of your Next.js app with the beautiful, easy-to-use interface of Squarespace!
