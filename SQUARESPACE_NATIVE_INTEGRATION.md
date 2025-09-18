# Squarespace Native Events Integration Guide

## 🎯 Overview
Integrate your legal events directly into Squarespace's native Events Page system using automation tools and APIs.

## 🔄 Method 1: Zapier Automation (Recommended)

### Why Zapier?
- ✅ No coding required
- ✅ Automatic synchronization
- ✅ Uses Squarespace's native Events system
- ✅ Built-in error handling and retries
- ✅ Can handle bulk imports

### Setup Steps

#### Step 1: Create Zapier Account
1. Go to [zapier.com](https://zapier.com) and create an account
2. Choose a plan that supports webhooks (Starter plan or higher)

#### Step 2: Create Your Zap
1. **Click "Create Zap"**
2. **Set up Trigger:**
   - Choose **"Webhooks by Zapier"**
   - Select **"Catch Hook"**
   - Copy the webhook URL Zapier provides

#### Step 3: Configure Your Events API
Use this webhook URL to trigger when new events are available:
```
Your Zapier Webhook URL: [PROVIDED BY ZAPIER]
```

You can test with:
```bash
curl -X POST [YOUR_ZAPIER_WEBHOOK_URL] \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Legal Event",
    "description": "Test event description",
    "startDate": "2024-01-15T10:00:00Z",
    "endDate": "2024-01-15T12:00:00Z",
    "location": "NYC Bar Association",
    "community": "NYC Bar",
    "hasCLE": true,
    "cleCredits": 2.0,
    "url": "https://example.com/event"
  }'
```

#### Step 4: Set up Squarespace Action
1. **Choose Action App:** Search for "Squarespace"
2. **Select Action:** "Create Event" or "Create Item in Collection"
3. **Connect your Squarespace account**
4. **Map the fields:**
   - Title → Event Name
   - Description → Event Description  
   - Start Date → Event Start Date
   - End Date → Event End Date
   - Location → Event Location
   - Custom fields for CLE info, community, etc.

#### Step 5: Test and Enable
1. **Test the Zap** with sample data
2. **Turn on the Zap** to start automatic syncing

### Advanced Zapier Setup

#### Multi-Step Zap for Bulk Import
1. **Trigger:** Webhook (your events API)
2. **Filter:** Only process events for next 30 days
3. **Formatter:** Clean up description text
4. **Squarespace:** Create Event
5. **Email:** Send confirmation (optional)

#### Scheduled Sync
1. **Trigger:** Schedule by Zapier (daily/weekly)
2. **Webhook:** GET your events API
3. **Loop:** For each event
4. **Squarespace:** Create/Update Event

## 🔧 Method 2: Direct API Integration

### Using Your Custom Sync Endpoint
We've created a custom endpoint for direct Squarespace API integration:

**Endpoint:** `https://legal.somethingtodo.nyc/api/squarespace/sync`

#### Setup Requirements
1. **Squarespace API Key** (from your Squarespace account)
2. **Squarespace Site ID** 
3. **Sync Secret** (set in your environment)

#### How to Get Squarespace API Credentials
1. Log into your Squarespace account
2. Go to **Settings** → **Advanced** → **API Keys**
3. Create a new API key with Events permissions
4. Note your Site ID from the URL or API section

#### Manual Sync Call
```bash
curl -X POST https://legal.somethingtodo.nyc/api/squarespace/sync \
  -H "Content-Type: application/json" \
  -d '{
    "squarespaceApiKey": "YOUR_API_KEY",
    "squareSiteId": "YOUR_SITE_ID", 
    "secret": "YOUR_SYNC_SECRET"
  }'
```

## 🎨 Method 3: Custom Collection Integration

### Create Events Collection
1. **In Squarespace Admin:**
   - Go to **Pages** → **Collections**
   - Create new **Events Collection**
   - Add custom fields:
     - Event Date (Date)
     - End Date (Date) 
     - Location (Text)
     - Community (Text)
     - CLE Credits (Number)
     - Has CLE (Checkbox)
     - External URL (URL)

### Automation with Collection
Use Zapier to populate your custom Events collection:
1. **Trigger:** Your events webhook
2. **Action:** Squarespace "Create Collection Item"
3. **Collection:** Your Events collection

## 📅 Method 4: Calendar Import (Bulk)

### Using ICS/iCal Files
Squarespace can import calendar files:

1. **Generate ICS file** from your events API:
   ```
   GET https://legal.somethingtodo.nyc/api/events/ics
   ```

2. **Import to Squarespace:**
   - Go to **Events** page in Squarespace
   - Look for **Import** or **Calendar** options
   - Upload the ICS file

### Automated ICS Sync
Create a scheduled process:
1. **Daily:** Download fresh ICS file
2. **Upload:** Via Squarespace import
3. **Clean:** Remove old events

## ⚙️ Environment Setup

Add these to your `.env.local`:
```env
SQUARESPACE_SYNC_SECRET=your_secure_secret_here
SQUARESPACE_API_KEY=your_squarespace_api_key
SQUARESPACE_SITE_ID=your_site_id
```

## 🔄 Automation Strategies

### Option A: Real-time Sync (Zapier)
- **Trigger:** When events are updated in your system
- **Action:** Immediately sync to Squarespace
- **Best for:** Live updates, small volumes

### Option B: Scheduled Sync (Daily)
- **Schedule:** Daily at 6 AM
- **Process:** Sync all events updated in last 24 hours
- **Best for:** Bulk processing, reliability

### Option C: Manual Sync (On-demand)
- **Trigger:** Manual webhook call
- **Process:** Sync specific events or date ranges
- **Best for:** Testing, controlled updates

## 📊 Data Mapping

### Your API → Squarespace Events
```json
{
  "name": "title",
  "description": "description", 
  "startDate": "startDate",
  "endDate": "endDate",
  "locationText": "location",
  "communityText": "organizer",
  "hasCLE": "customField_hasCLE",
  "cleCredits": "customField_cleCredits",
  "url": "customField_externalUrl"
}
```

## 🚨 Important Considerations

### Squarespace Limitations
- **API Rate Limits:** Usually 100 requests/hour
- **Event Limits:** Check your plan's event limits
- **Custom Fields:** May be limited depending on plan

### Best Practices
1. **Batch Processing:** Don't sync more than 50 events at once
2. **Error Handling:** Always check API responses
3. **Deduplication:** Prevent duplicate events
4. **Backup:** Keep your original data safe

### Monitoring
- **Check Zapier logs** for failed syncs
- **Monitor API usage** in Squarespace
- **Set up alerts** for sync failures

## 🛠️ Troubleshooting

### Common Issues
1. **API Key Errors:** Verify permissions and expiration
2. **Rate Limiting:** Add delays between requests
3. **Field Mapping:** Check required vs optional fields
4. **Date Formats:** Ensure ISO 8601 format

### Testing
1. **Start small:** Sync 1-2 events first
2. **Check formatting:** Verify events display correctly
3. **Test updates:** Ensure existing events update properly

## 📞 Support Resources
- **Zapier Help:** [zapier.com/help](https://zapier.com/help)
- **Squarespace API Docs:** [developers.squarespace.com](https://developers.squarespace.com)
- **Your Events API:** `https://legal.somethingtodo.nyc/api/events/squarespace`

## 🎯 Recommended Approach

**For Non-Technical Users:** Use **Method 1 (Zapier)** with the Events Page
**For Developers:** Use **Method 2 (Direct API)** for full control
**For Custom Needs:** Use **Method 3 (Collections)** for maximum flexibility

The Zapier approach is typically the best balance of functionality and ease of use!
