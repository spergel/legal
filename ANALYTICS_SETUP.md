# Analytics & Ad Infrastructure Setup Guide

## 📊 Analytics Setup

### 1. Google Analytics 4 (GA4)

1. **Create GA4 Property:**
   - Go to [Google Analytics](https://analytics.google.com/)
   - Create a new property for "Legal Events NYC"
   - Choose "Web" as the platform
   - Enter your website URL: `https://lawyerevents.net`

2. **Get Measurement ID:**
   - In GA4, go to Admin → Data Streams
   - Click on your web stream
   - Copy the Measurement ID (format: G-XXXXXXXXXX)

3. **Add to Environment Variables:**
   ```bash
   NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
   ```

### 2. Facebook Pixel

1. **Create Facebook Pixel:**
   - Go to [Facebook Business Manager](https://business.facebook.com/)
   - Navigate to Events Manager
   - Create a new Pixel
   - Name it "Legal Events NYC Pixel"

2. **Get Pixel ID:**
   - Copy the Pixel ID (format: XXXXXXXXXX)

3. **Add to Environment Variables:**
   ```bash
   NEXT_PUBLIC_FACEBOOK_PIXEL_ID="XXXXXXXXXX"
   ```

### 3. Environment Variables

Add these to your `.env.local` file:

```bash
# Analytics & Tracking
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
NEXT_PUBLIC_FACEBOOK_PIXEL_ID="XXXXXXXXXX"

# Ad Management (for future use)
AD_MANAGEMENT_API_KEY="your-ad-api-key"
AD_MANAGEMENT_ENDPOINT="https://your-ad-management-api.com"
```

## 🎯 Ad Infrastructure Setup

### 1. Ad Inventory Map

Your site now has these ad positions:

- **Homepage Top Banner** (`homepage-top`): 728x90px banner
- **Homepage Sidebar** (`homepage-sidebar`): 300x250px sidebar ad
- **Events Sidebar** (`events-sidebar`): 300x250px sidebar ad
- **Newsletter** (`newsletter`): 600x200px newsletter ad

### 2. Ad Tracking Features

✅ **Implemented:**
- Impression tracking (Google Analytics + Facebook Pixel)
- Click tracking with UTM parameters
- Ad performance analytics
- Admin dashboard for ad management

### 3. Ad Management Dashboard

Access via `/admin` → "Ad Management" tab:

- View ad performance metrics
- Track impressions, clicks, CTR, revenue
- Manage ad status (active/paused/expired)
- Add/edit advertisements

## 📈 Tracking Events

The following events are automatically tracked:

### User Interactions
- **Event Views**: When users view event details
- **Event Clicks**: When users click on event links
- **Event Bookmarks**: When users star/save events
- **Event Submissions**: When users submit new events
- **Newsletter Signups**: When users subscribe
- **Calendar Exports**: When users export ICS/RSS feeds

### Ad Interactions
- **Ad Impressions**: When ads are displayed
- **Ad Clicks**: When users click on ads
- **Ad Performance**: CTR, revenue tracking

### Page Views
- **Navigation**: Track page views across the site
- **UTM Parameters**: Track traffic sources

## 🔧 Implementation Details

### Analytics Utility Functions

Located in `src/lib/analytics.ts`:

```typescript
// Track event views
trackEventView(eventName, eventId);

// Track ad clicks
trackEventClick(eventName, eventId, source);

// Track newsletter signups
trackNewsletterSignup(source);

// Track with UTM parameters
trackEventWithUTM(action, category, label, value);
```

### Ad Components

- **AdBanner**: Reusable ad component with tracking
- **AdManagementDashboard**: Admin interface for ad management
- **API Routes**: `/api/ads` for ad data and tracking

## 📊 Monitoring & Reporting

### Google Analytics 4
- **Real-time Reports**: Monitor live traffic
- **Audience Reports**: Understand your users
- **Acquisition Reports**: Track traffic sources
- **Behavior Reports**: Analyze user interactions
- **Conversion Reports**: Track goals and conversions

### Facebook Pixel
- **Custom Audiences**: Create targeted audiences
- **Lookalike Audiences**: Find similar users
- **Conversion Tracking**: Track specific actions
- **Retargeting**: Re-engage visitors

### Admin Dashboard
- **Ad Performance**: View ad metrics in real-time
- **Revenue Tracking**: Monitor ad revenue
- **CTR Analysis**: Analyze click-through rates
- **Impression Data**: Track ad visibility

## 🚀 Next Steps

### Immediate Actions
1. Set up Google Analytics 4 property
2. Create Facebook Pixel
3. Add environment variables
4. Test tracking on your site

### Future Enhancements
1. **Google Ad Manager**: For advanced ad serving
2. **Custom Ad Database**: Store ad data in your database
3. **Ad Scheduling**: Schedule ads for specific dates
4. **A/B Testing**: Test different ad creatives
5. **Revenue Optimization**: Implement dynamic pricing

### Advanced Features
1. **Programmatic Advertising**: Connect with ad exchanges
2. **Real-time Bidding**: Implement RTB for ads
3. **Ad Fraud Detection**: Protect against invalid traffic
4. **Advanced Analytics**: Custom dashboards and reports

## 🔍 Testing

### Verify Analytics Setup
1. Visit your site and check browser console for GA4/FB Pixel
2. Use Google Analytics Real-time reports
3. Use Facebook Pixel Helper browser extension
4. Test UTM parameters: `?utm_source=test&utm_medium=email&utm_campaign=test`

### Verify Ad Tracking
1. Check ad impressions in admin dashboard
2. Test ad clicks and verify tracking
3. Monitor analytics for ad events
4. Verify UTM parameter tracking

## 📞 Support

For issues with:
- **Google Analytics**: Check GA4 documentation
- **Facebook Pixel**: Check Facebook Business Help
- **Ad Implementation**: Review the code in `src/components/AdBanner.tsx`
- **Tracking Issues**: Check browser console for errors
