# Squarespace Full Integration - Step by Step Guide

This guide will walk you through setting up a complete bidirectional integration between your Next.js legal events platform and Squarespace.

## 🎯 What We'll Build

- **Squarespace site** that displays events from your Next.js backend
- **Event submission form** in Squarespace that sends events to your backend
- **Automatic sync** between both systems
- **Custom styling** for professional event display
- **Admin interface** in Squarespace for event management

## 📋 Prerequisites

- Squarespace account (Personal plan or higher)
- Access to your Next.js backend API
- Basic understanding of copy/pasting code
- 2-3 hours of setup time

## 🚀 Step 1: Set Up Squarespace Site

### 1.1 Create Squarespace Account
1. Go to [squarespace.com](https://squarespace.com)
2. Click "Get Started"
3. Choose a template (recommend "Bedford" or "Five" for event sites)
4. Select a plan (Personal plan minimum for custom code)

### 1.2 Choose Your Domain
- **Option A**: Use Squarespace subdomain (free, like `yoursite.squarespace.com`)
- **Option B**: Connect your own domain (recommended for professional use)

### 1.3 Basic Site Setup
1. **Site Title**: "NYC Legal Events" (or your preferred name)
2. **Tagline**: "Your source for legal networking and CLE events"
3. **Logo**: Upload your logo if you have one

## 🏗 Step 2: Create Site Structure

### 2.1 Create Main Pages
1. **Home** - Landing page with featured events
2. **Events** - Full events listing
3. **Submit Event** - Form for event submissions
4. **About** - Information about your platform
5. **Contact** - Contact information

### 2.2 Set Up Navigation
1. Go to **Design** → **Site Styles** → **Navigation**
2. Add your main pages to the navigation
3. Set up mobile navigation

## 📝 Step 3: Create Event Content Structure

### 3.1 Create Blog for Events
1. Go to **Pages** → **Add Page** → **Blog**
2. **Page Title**: "Legal Events"
3. **URL Slug**: "events"
4. **Description**: "Latest legal events and networking opportunities"

### 3.2 Configure Blog Settings
1. **Post URL**: `/events/[post-title]`
2. **Enable comments**: No (unless you want them)
3. **Enable social sharing**: Yes
4. **Post sidebar**: Disable (for cleaner look)

### 3.3 Set Up Categories
1. Go to **Settings** → **Blogging** → **Categories**
2. Create categories:
   - "CLE Events"
   - "Networking"
   - "Conferences"
   - "Workshops"
   - "Featured"

## 🔧 Step 4: Add Custom Code

### 4.1 Enable Developer Platform
1. Go to **Settings** → **Advanced** → **Developer Platform**
2. Click "Enable Developer Platform"
3. Note your **Site ID** (you'll need this later)

### 4.2 Add Code Injection

#### Header Code (Settings → Advanced → Code Injection → Header):
```html
<!-- Event Integration Styles -->
<style>
/* Event Card Styles */
.event-card {
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 24px;
  margin: 20px 0;
  background: #fff;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.event-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px rgba(0,0,0,0.15);
}

.event-card h3 {
  color: #2c3e50;
  margin-bottom: 12px;
  font-size: 1.5em;
  font-weight: 600;
}

.event-date {
  color: #e74c3c;
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 1.1em;
}

.event-location {
  color: #7f8c8d;
  margin-bottom: 12px;
  font-size: 1em;
}

.event-community {
  color: #3498db;
  font-weight: 500;
  margin-bottom: 15px;
}

.event-description {
  color: #555;
  line-height: 1.6;
  margin-bottom: 20px;
}

.event-link {
  display: inline-block;
  background: #3498db;
  color: white;
  padding: 12px 24px;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 500;
  transition: background 0.3s;
}

.event-link:hover {
  background: #2980b9;
  color: white;
}

.events-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
}

.error {
  background: #e74c3c;
  color: white;
  padding: 15px;
  border-radius: 6px;
  margin: 20px 0;
}

/* Form Styles */
.event-form {
  background: #f8f9fa;
  padding: 30px;
  border-radius: 12px;
  margin: 20px 0;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #2c3e50;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  box-sizing: border-box;
}

.form-group textarea {
  height: 120px;
  resize: vertical;
}

.submit-btn {
  background: #27ae60;
  color: white;
  padding: 15px 30px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.submit-btn:hover {
  background: #229954;
}

.submit-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.success-message {
  background: #d4edda;
  color: #155724;
  padding: 15px;
  border-radius: 6px;
  margin: 20px 0;
  border: 1px solid #c3e6cb;
}
</style>
```

#### Footer Code (Settings → Advanced → Code Injection → Footer):
```html
<script>
// Configuration
const API_BASE_URL = 'https://lawyerevents.net/api/events';
const SITE_ID = 'YOUR_SITE_ID_HERE'; // Replace with your actual site ID

// Event Management Functions
class EventManager {
  constructor() {
    this.events = [];
    this.init();
  }

  async init() {
    console.log('🚀 Event Manager initialized');
    await this.loadEvents();
    this.setupEventListeners();
  }

  // Load events from your Next.js backend
  async loadEvents() {
    try {
      console.log('📡 Fetching events from backend...');
      const response = await fetch(`${API_BASE_URL}/cms?limit=50&status=approved,featured`);
      const data = await response.json();
      
      if (data.success) {
        this.events = data.data;
        console.log(`✅ Loaded ${this.events.length} events`);
        this.displayEvents();
      } else {
        throw new Error('Failed to fetch events');
      }
    } catch (error) {
      console.error('❌ Error loading events:', error);
      this.showError('Failed to load events. Please try again later.');
    }
  }

  // Display events on the page
  displayEvents() {
    const container = document.getElementById('events-container');
    if (!container) {
      console.warn('⚠️ Events container not found');
      return;
    }

    if (this.events.length === 0) {
      container.innerHTML = '<div class="loading">No events found. Check back soon!</div>';
      return;
    }

    container.innerHTML = this.events.map(event => this.createEventCard(event)).join('');
  }

  // Create HTML for individual event card
  createEventCard(event) {
    const startDate = new Date(event.start_date);
    const formattedDate = startDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const formattedTime = startDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    return `
      <div class="event-card">
        <h3>${this.escapeHtml(event.title)}</h3>
        <div class="event-date">📅 ${formattedDate} at ${formattedTime}</div>
        ${event.location ? `<div class="event-location">📍 ${this.escapeHtml(event.location.name)}</div>` : ''}
        ${event.community ? `<div class="event-community">🏢 ${this.escapeHtml(event.community.name)}</div>` : ''}
        <div class="event-description">${this.escapeHtml(event.excerpt)}</div>
        <a href="${event.url}" class="event-link" target="_blank">Learn More & Register</a>
      </div>
    `;
  }

  // Submit new event to backend
  async submitEvent(eventData) {
    try {
      console.log('📤 Submitting event to backend...', eventData);
      
      const response = await fetch(`${API_BASE_URL}/cms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: eventData.title,
          description: eventData.description,
          start_date: eventData.start_date,
          end_date: eventData.end_date,
          location_name: eventData.location_name,
          location_address: eventData.location_address,
          community_name: eventData.community_name,
          contact_email: eventData.contact_email,
          photo_url: eventData.photo_url,
          cms_id: `squarespace-${Date.now()}`,
          cms_type: 'squarespace'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Event submitted successfully:', result);
        this.showSuccess('Event submitted successfully! It will be reviewed and published soon.');
        this.resetForm();
        // Refresh events after successful submission
        setTimeout(() => this.loadEvents(), 2000);
      } else {
        throw new Error(result.error || 'Failed to submit event');
      }
    } catch (error) {
      console.error('❌ Error submitting event:', error);
      this.showError('Failed to submit event. Please try again.');
    }
  }

  // Setup event listeners
  setupEventListeners() {
    // Event submission form
    const form = document.getElementById('event-submission-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmit(e);
      });
    }

    // Refresh button
    const refreshBtn = document.getElementById('refresh-events');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadEvents();
      });
    }
  }

  // Handle form submission
  handleFormSubmit(event) {
    const form = event.target;
    const formData = new FormData(form);
    
    const eventData = {
      title: formData.get('title'),
      description: formData.get('description'),
      start_date: formData.get('start_date'),
      end_date: formData.get('end_date'),
      location_name: formData.get('location_name'),
      location_address: formData.get('location_address'),
      community_name: formData.get('community_name'),
      contact_email: formData.get('contact_email'),
      photo_url: formData.get('photo_url')
    };

    // Validate required fields
    if (!eventData.title || !eventData.description || !eventData.contact_email) {
      this.showError('Please fill in all required fields.');
      return;
    }

    // Disable submit button
    const submitBtn = form.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    // Submit event
    this.submitEvent(eventData).finally(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Event';
    });
  }

  // Utility functions
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showError(message) {
    const container = document.getElementById('events-container') || document.body;
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    container.insertBefore(errorDiv, container.firstChild);
    
    // Remove error after 5 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 5000);
  }

  showSuccess(message) {
    const container = document.getElementById('events-container') || document.body;
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    container.insertBefore(successDiv, container.firstChild);
    
    // Remove success message after 5 seconds
    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.parentNode.removeChild(successDiv);
      }
    }, 5000);
  }

  resetForm() {
    const form = document.getElementById('event-submission-form');
    if (form) {
      form.reset();
    }
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  window.eventManager = new EventManager();
});
</script>
```

## 📄 Step 5: Create Page Content

### 5.1 Home Page Setup
1. Go to **Pages** → **Home**
2. Add a **Text Block** with this content:

```html
<div id="events-container">
  <div class="loading">Loading events...</div>
</div>

<button id="refresh-events" style="display: block; margin: 20px auto; padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 6px; cursor: pointer;">
  🔄 Refresh Events
</button>
```

### 5.2 Events Page Setup
1. Go to **Pages** → **Events**
2. Add the same content as the home page
3. This will show all events in a dedicated page

### 5.3 Submit Event Page Setup
1. Go to **Pages** → **Submit Event**
2. Add a **Form Block** with these fields:

**Form Fields:**
- **Event Title** (Text, Required)
- **Description** (Textarea, Required)
- **Start Date** (Date, Required)
- **End Date** (Date, Optional)
- **Location Name** (Text, Required)
- **Location Address** (Textarea, Optional)
- **Community/Organization** (Text, Required)
- **Contact Email** (Email, Required)
- **Event Photo URL** (Text, Optional)

3. **Form Settings:**
   - **Form Name**: "Event Submission"
   - **Submit Button Text**: "Submit Event"
   - **Success Message**: "Thank you! Your event has been submitted for review."

4. **Add Custom Form HTML** (in Form Block settings):
```html
<form id="event-submission-form" class="event-form">
  <div class="form-group">
    <label for="title">Event Title *</label>
    <input type="text" id="title" name="title" required>
  </div>
  
  <div class="form-group">
    <label for="description">Event Description *</label>
    <textarea id="description" name="description" required></textarea>
  </div>
  
  <div class="form-group">
    <label for="start_date">Start Date *</label>
    <input type="datetime-local" id="start_date" name="start_date" required>
  </div>
  
  <div class="form-group">
    <label for="end_date">End Date</label>
    <input type="datetime-local" id="end_date" name="end_date">
  </div>
  
  <div class="form-group">
    <label for="location_name">Location Name *</label>
    <input type="text" id="location_name" name="location_name" required>
  </div>
  
  <div class="form-group">
    <label for="location_address">Location Address</label>
    <textarea id="location_address" name="location_address"></textarea>
  </div>
  
  <div class="form-group">
    <label for="community_name">Community/Organization *</label>
    <input type="text" id="community_name" name="community_name" required>
  </div>
  
  <div class="form-group">
    <label for="contact_email">Contact Email *</label>
    <input type="email" id="contact_email" name="contact_email" required>
  </div>
  
  <div class="form-group">
    <label for="photo_url">Event Photo URL</label>
    <input type="url" id="photo_url" name="photo_url">
  </div>
  
  <button type="submit" class="submit-btn">Submit Event</button>
</form>
```

## 🔧 Step 6: Configure API Settings

### 6.1 Update Site ID
1. In your footer code, replace `YOUR_SITE_ID_HERE` with your actual Squarespace Site ID
2. You can find this in **Settings** → **Advanced** → **Developer Platform**

### 6.2 Test API Connection
1. Save all your changes
2. Go to your home page
3. Open browser developer tools (F12)
4. Check the console for any errors
5. You should see "🚀 Event Manager initialized" and "✅ Loaded X events"

## 🎨 Step 7: Customize Design

### 7.1 Site Styles
1. Go to **Design** → **Site Styles**
2. **Colors**: Choose colors that match your brand
3. **Fonts**: Select professional fonts
4. **Spacing**: Adjust margins and padding

### 7.2 Mobile Optimization
1. Test your site on mobile devices
2. Adjust styles in the header code if needed
3. Ensure forms work well on mobile

## 🚀 Step 8: Go Live

### 8.1 Final Testing
1. **Test event loading** on all pages
2. **Test event submission** form
3. **Test on different devices** and browsers
4. **Check for any console errors**

### 8.2 Launch Checklist
- [ ] All pages are working
- [ ] Events are loading from your backend
- [ ] Event submission form works
- [ ] Mobile version looks good
- [ ] No console errors
- [ ] Custom domain is connected (if applicable)

## 🔄 Step 9: Set Up Automation (Optional)

### 9.1 Auto-refresh Events
Add this to your footer code to auto-refresh events every 5 minutes:

```javascript
// Auto-refresh events every 5 minutes
setInterval(() => {
  if (window.eventManager) {
    window.eventManager.loadEvents();
  }
}, 5 * 60 * 1000);
```

### 9.2 Email Notifications
Set up email notifications in your Next.js backend to notify you when new events are submitted through Squarespace.

## 🎯 Step 10: Monitor and Maintain

### 10.1 Regular Checks
- **Monitor console errors** weekly
- **Check event loading** daily
- **Review submitted events** in your Next.js admin
- **Update content** as needed

### 10.2 Performance Optimization
- **Monitor page load times**
- **Optimize images** if needed
- **Consider caching** for better performance

## 🆘 Troubleshooting

### Common Issues:

**Events not loading:**
- Check console for API errors
- Verify your API URL is correct
- Ensure your Next.js backend is running

**Form not submitting:**
- Check form field names match the code
- Verify all required fields are filled
- Check console for JavaScript errors

**Styling issues:**
- Clear browser cache
- Check CSS syntax in header code
- Test on different browsers

**Mobile issues:**
- Test on actual mobile devices
- Adjust CSS media queries if needed
- Check form usability on mobile

## 🎉 You're Done!

Your Squarespace site is now fully integrated with your Next.js legal events platform! 

**What you have:**
- ✅ Beautiful, professional website
- ✅ Events automatically loaded from your backend
- ✅ Event submission form for users
- ✅ Mobile-responsive design
- ✅ Easy content management through Squarespace
- ✅ SEO optimization
- ✅ Analytics ready

**Next steps:**
- Share your new Squarespace site
- Promote event submissions
- Monitor and maintain the integration
- Consider adding more features as needed

This integration gives you the best of both worlds - the powerful event management of your Next.js app with the beautiful, easy-to-use interface of Squarespace!
