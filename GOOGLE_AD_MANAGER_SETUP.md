# Google Ad Manager Setup Guide

## 🎯 Overview

We're replacing our custom ad management system with Google Ad Manager (GAM), which provides:
- **Free enterprise-level ad serving**
- **Professional ad management interface**
- **Advanced targeting and optimization**
- **Real-time reporting and analytics**

## 🚀 Setup Steps

### 1. Create Google Ad Manager Account
1. Go to [Google Ad Manager](https://admanager.google.com/)
2. Sign in with your Google account
3. Click "Create Account"
4. Fill in account details:
   - **Account Name:** Legal Events NYC
   - **Country:** United States
   - **Currency:** USD
   - **Time Zone:** Eastern Time

### 2. Configure Network Settings
1. **Network Code:** Note this down (you'll need it)
2. **Ad Units:** Create ad units for different positions:
   - Homepage Banner (728x90)
   - Sidebar (300x600)
   - Newsletter (300x250)
   - Events Page (728x90)

### 3. Generate Ad Tags
For each ad unit, generate HTML code like:
```html
<!-- Homepage Banner Ad -->
<div id="div-gpt-ad-homepage-banner">
  <script>
    googletag.cmd.push(function() {
      googletag.defineSlot('/1234567/homepage-banner', [728, 90], 'div-gpt-ad-homepage-banner')
        .addService(googletag.pubads());
      googletag.pubads().enableSingleRequest();
      googletag.enableServices();
    });
  </script>
  <script async src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"></script>
</div>
```

### 4. Add to Website
1. **Add Google Ad Manager script** to your layout
2. **Place ad tags** in strategic positions
3. **Test ad delivery** in different environments

## 📍 Ad Placement Strategy

### Homepage
- **Top Banner:** Above hero section (728x90)
- **Sidebar:** Right side of content (300x600)

### Events Page
- **Top Banner:** Above event list (728x90)
- **Sidebar:** Right side of filters (300x600)

### Newsletter
- **Inline Ad:** Between content sections (300x250)

## 🔧 Technical Implementation

### 1. Add GAM Script to Layout
```tsx
// In src/app/layout.tsx
<Script
  src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"
  strategy="afterInteractive"
/>
```

### 2. Create Ad Component
```tsx
// src/components/GoogleAd.tsx
interface GoogleAdProps {
  adUnit: string;
  size: [number, number];
  position: string;
}

export default function GoogleAd({ adUnit, size, position }: GoogleAdProps) {
  useEffect(() => {
    // Initialize ad
    googletag.cmd.push(function() {
      googletag.defineSlot(adUnit, size, `div-gpt-ad-${position}`)
        .addService(googletag.pubads());
      googletag.pubads().enableSingleRequest();
      googletag.enableServices();
    });
  }, [adUnit, size, position]);

  return (
    <div id={`div-gpt-ad-${position}`}>
      {/* Ad will be inserted here */}
    </div>
  );
}
```

### 3. Use Ad Component
```tsx
// In your pages
<GoogleAd 
  adUnit="/1234567/homepage-banner"
  size={[728, 90]}
  position="homepage-banner"
/>
```

## 📊 Ad Management

### Creating Campaigns
1. **Line Items:** Define ad delivery rules
2. **Creatives:** Upload ad images/videos
3. **Targeting:** Set audience and placement rules
4. **Scheduling:** Set start/end dates

### Monitoring Performance
- **Impressions:** How many times ads were shown
- **Clicks:** User interactions with ads
- **CTR:** Click-through rate
- **Revenue:** Earnings from ad campaigns

## 💰 Monetization

### Ad Inventory Pricing
- **Homepage Banner:** $500-1000/month
- **Sidebar:** $300-600/month
- **Newsletter:** $200-400/month
- **Events Page:** $400-800/month

### Revenue Optimization
- **A/B Testing:** Test different ad formats
- **Targeting:** Optimize for your audience
- **Seasonality:** Adjust pricing for peak times
- **Competition:** Monitor market rates

## 🎨 Ad Design Guidelines

### Banner Ads (728x90)
- **File Size:** <150KB
- **Format:** JPG, PNG, GIF
- **Animation:** Keep under 30 seconds
- **Text:** Ensure readability at small sizes

### Sidebar Ads (300x600)
- **File Size:** <200KB
- **Format:** JPG, PNG, GIF
- **Content:** More detailed information
- **Call-to-Action:** Clear and prominent

### Newsletter Ads (300x250)
- **File Size:** <100KB
- **Format:** JPG, PNG
- **Content:** Relevant to newsletter topic
- **Branding:** Consistent with your site

## 🔍 Testing & Optimization

### Ad Testing
1. **Preview Mode:** Test ads before going live
2. **Multiple Browsers:** Ensure cross-browser compatibility
3. **Mobile Testing:** Check responsive behavior
4. **Performance Testing:** Monitor load times

### Optimization
1. **A/B Testing:** Test different ad creatives
2. **Performance Monitoring:** Track key metrics
3. **User Feedback:** Gather input on ad experience
4. **Revenue Analysis:** Optimize for highest returns

## 📱 Mobile Considerations

### Responsive Ads
- **Adaptive Sizing:** Ads that resize for mobile
- **Touch-Friendly:** Ensure buttons are large enough
- **Load Speed:** Optimize for mobile networks
- **User Experience:** Don't interfere with content

## 🚨 Common Issues & Solutions

### Ads Not Loading
- **Check Network Code:** Verify it's correct
- **Script Loading:** Ensure GAM script loads first
- **Ad Blockers:** Test with ad blockers disabled
- **Console Errors:** Check browser console for errors

### Poor Performance
- **Ad Placement:** Optimize ad positions
- **Targeting:** Refine audience targeting
- **Creative Quality:** Improve ad designs
- **Page Speed:** Optimize overall page performance

## 📞 Support Resources

### Google Ad Manager Help
- [Official Documentation](https://support.google.com/admanager/)
- [Community Forum](https://support.google.com/admanager/community)
- [YouTube Channel](https://www.youtube.com/user/GoogleAdManager)

### Best Practices
- [Ad Quality Guidelines](https://support.google.com/admanager/answer/6160417)
- [Mobile Optimization](https://support.google.com/admanager/answer/6160417)
- [Revenue Optimization](https://support.google.com/admanager/answer/6160417)

---

*This guide will be updated as we implement Google Ad Manager and learn best practices.*
