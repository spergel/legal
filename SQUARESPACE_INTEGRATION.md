# Squarespace Integration Guide

## 🎯 Overview
Integrate your legal events calendar with Squarespace to automatically display events on your website using our REST API and RSS feeds.

## 📡 API Endpoints Available

### 1. **Squarespace-Optimized JSON API** (Recommended)
```
GET https://legal.somethingtodo.nyc/api/events/squarespace
```

**Query Parameters:**
- `limit=50` - Number of events (max 200)
- `featured=true` - Only featured events
- `community=NYSBA` - Filter by organization
- `cle=true` - Only CLE events
- `days=30` - Events in next X days

**Example URLs:**
```
https://legal.somethingtodo.nyc/api/events/squarespace?limit=20&days=14
https://legal.somethingtodo.nyc/api/events/squarespace?featured=true&limit=10
https://legal.somethingtodo.nyc/api/events/squarespace?community=NYSBA&cle=true
```

### 2. **Enhanced RSS Feed**
```
GET https://legal.somethingtodo.nyc/api/rss
```

**Query Parameters:**
- `org=NYSBA,Brooklyn Bar` - Filter by organizations
- `id=event1,event2` - Specific event IDs

**Example URLs:**
```
https://legal.somethingtodo.nyc/api/rss
https://legal.somethingtodo.nyc/api/rss?org=NYSBA
https://legal.somethingtodo.nyc/api/rss?org=Brooklyn Bar,NYC Bar
```

### 3. **CMS-Compatible API**
```
GET https://legal.somethingtodo.nyc/api/events/cms
```

## 🔧 Squarespace Integration Methods

### Method 1: Code Injection (Recommended)
Add this JavaScript to your Squarespace site to automatically pull and display events.

#### Step 1: Add to Site Header
In Squarespace Admin → Settings → Advanced → Code Injection → Header:

```html
<style>
.legal-events-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.legal-event-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.legal-event-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.event-title {
  font-size: 1.4em;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 10px;
}

.event-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 15px;
  font-size: 0.9em;
  color: #7f8c8d;
}

.event-date {
  font-weight: bold;
  color: #e74c3c;
}

.event-location {
  color: #27ae60;
}

.event-community {
  color: #3498db;
}

.event-cle {
  background: #f39c12;
  color: white;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.8em;
}

.event-description {
  margin-bottom: 15px;
  line-height: 1.6;
}

.event-actions {
  display: flex;
  gap: 10px;
}

.event-btn {
  padding: 8px 16px;
  border-radius: 4px;
  text-decoration: none;
  font-size: 0.9em;
  transition: background-color 0.2s;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
  color: white;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
  color: white;
}

.loading-message {
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
}

.error-message {
  background: #e74c3c;
  color: white;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .event-meta {
    flex-direction: column;
    gap: 8px;
  }
  
  .event-actions {
    flex-direction: column;
  }
}
</style>
```

#### Step 2: Create Events Page
1. Create a new page in Squarespace
2. Add a **Code Block** 
3. Paste this HTML/JavaScript:

```html
<div id="legal-events-container" class="legal-events-container">
  <div class="loading-message">Loading legal events...</div>
</div>

<script>
async function loadLegalEvents() {
  const container = document.getElementById('legal-events-container');
  
  try {
    // Configure your preferences here
    const config = {
      limit: 20,           // Number of events to show
      days: 30,           // Events in next 30 days
      featured: false,    // Set to true for only featured events
      community: '',      // Filter by community (e.g., 'NYSBA')
      cle: false         // Set to true for only CLE events
    };
    
    // Build URL with parameters
    const params = new URLSearchParams();
    params.append('limit', config.limit);
    params.append('days', config.days);
    if (config.featured) params.append('featured', 'true');
    if (config.community) params.append('community', config.community);
    if (config.cle) params.append('cle', 'true');
    
    const url = `https://legal.somethingtodo.nyc/api/events/squarespace?${params}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to load events');
    }
    
    if (data.events.length === 0) {
      container.innerHTML = '<div class="loading-message">No upcoming events found.</div>';
      return;
    }
    
    // Generate HTML for events
    const eventsHTML = data.events.map(event => `
      <div class="legal-event-card">
        <div class="event-title">${event.title}</div>
        <div class="event-meta">
          <span class="event-date">📅 ${event.startDateFormatted}</span>
          <span class="event-location">📍 ${event.location}</span>
          <span class="event-community">🏛️ ${event.community}</span>
          ${event.hasCLE ? `<span class="event-cle">⚖️ ${event.cleText}</span>` : ''}
        </div>
        <div class="event-description">${event.excerpt}</div>
        <div class="event-actions">
          ${event.url ? `<a href="${event.url}" target="_blank" class="event-btn btn-primary">Register</a>` : ''}
          <a href="${event.calendarSubscribeUrl}" target="_blank" class="event-btn btn-secondary">Add to Calendar</a>
        </div>
      </div>
    `).join('');
    
    container.innerHTML = eventsHTML;
    
  } catch (error) {
    console.error('Error loading events:', error);
    container.innerHTML = `
      <div class="error-message">
        Error loading events: ${error.message}
      </div>
    `;
  }
}

// Load events when page loads
document.addEventListener('DOMContentLoaded', loadLegalEvents);
</script>
```

### Method 2: RSS Feed Integration
Squarespace has built-in RSS support. To add an RSS feed:

1. **Blog Integration**: 
   - Go to your blog settings
   - Add RSS import: `https://legal.somethingtodo.nyc/api/rss`

2. **Summary Block**:
   - Add a Summary Block to any page
   - Choose "External RSS" as source
   - Enter: `https://legal.somethingtodo.nyc/api/rss`

### Method 3: Custom Collection (Advanced)
For advanced users, you can create a custom collection that pulls from our API:

1. Create a new Collection in Squarespace
2. Use Zapier or similar service to periodically sync data
3. API endpoint: `https://legal.somethingtodo.nyc/api/events/squarespace`

## 🎛️ Customization Options

### Filter by Organization
```javascript
// Only show NYSBA events
const config = {
  community: 'NYSBA',
  limit: 10
};
```

### Featured Events Only
```javascript
// Only show featured/highlighted events
const config = {
  featured: true,
  limit: 5
};
```

### CLE Events Only
```javascript
// Only show CLE credit events
const config = {
  cle: true,
  limit: 15
};
```

### Upcoming Events (Next 2 Weeks)
```javascript
// Show events in next 14 days
const config = {
  days: 14,
  limit: 20
};
```

## 🎨 Styling Customization

You can customize the appearance by modifying the CSS in the header injection. Key classes:

- `.legal-event-card` - Individual event styling
- `.event-title` - Event name styling
- `.event-meta` - Date, location, organization info
- `.event-description` - Event description text
- `.event-btn` - Button styling

## 🔄 Auto-Refresh
To automatically refresh events every hour:

```javascript
// Add this to your code block
setInterval(loadLegalEvents, 3600000); // Refresh every hour
```

## 📱 Mobile Responsive
The provided CSS includes mobile-responsive design that automatically adapts to smaller screens.

## 🔍 SEO Benefits
- Events are loaded dynamically but search engine friendly
- Rich metadata included in RSS feeds
- Structured data for better search visibility

## 🛠️ Troubleshooting

### Events Not Loading
1. Check browser console for errors
2. Verify the API URL is accessible
3. Ensure JavaScript is enabled in Squarespace

### Styling Issues
1. Check for CSS conflicts with your theme
2. Adjust the CSS classes in the header injection
3. Use browser dev tools to inspect elements

### Performance Optimization
1. Reduce the `limit` parameter for faster loading
2. Use `days` parameter to limit date range
3. Enable caching in Squarespace settings

## 📞 Support
For issues with the API or integration, contact the legal events calendar team.

**API Status**: Live at `https://legal.somethingtodo.nyc`  
**Last Updated**: Events refresh every 6 hours automatically
