# Google Calendar Integration Guide

This guide shows how to use Google Calendar as a bridge between your Next.js legal events platform and Squarespace. This approach is simpler, more reliable, and leverages Google's robust calendar infrastructure.

## 🎯 Overview

**The Flow:**
```
Next.js Backend → Google Calendar → Squarespace
```

**Benefits:**
- ✅ **Simple setup** - No complex API integrations
- ✅ **Reliable sync** - Google handles the heavy lifting
- ✅ **Familiar interface** - Everyone knows Google Calendar
- ✅ **Automatic updates** - Changes sync automatically
- ✅ **Mobile friendly** - Works on all devices
- ✅ **Free** - No additional costs

## 🚀 Step 1: Set Up Google Calendar Integration

### 1.1 Create Google Calendar API Endpoint

First, let's create an endpoint in your Next.js app to export events to Google Calendar format:

```typescript
// src/app/api/events/calendar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'approved,featured';
    const format = searchParams.get('format') || 'ics'; // ics or json

    // Build where clause
    const whereClause: any = {};
    
    if (status) {
      whereClause.status = {
        in: status.split(',')
      };
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
        location: true,
        community: true,
      },
      orderBy: {
        startDate: 'asc'
      },
      take: 100
    });

    if (format === 'ics') {
      // Generate ICS (iCalendar) format
      const icsContent = generateICS(events);
      
      return new NextResponse(icsContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': 'attachment; filename="legal-events.ics"',
          'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        },
      });
    } else {
      // Return JSON format
      return NextResponse.json({
        success: true,
        data: events.map(event => ({
          id: event.id,
          title: event.name,
          description: event.description,
          start: event.startDate,
          end: event.endDate,
          location: event.location?.name || '',
          url: `https://lawyerevents.net/events/${event.id}`,
          status: event.status,
          community: event.community?.name || ''
        }))
      });
    }

  } catch (error) {
    console.error('Error generating calendar:', error);
    return NextResponse.json(
      { error: 'Failed to generate calendar' },
      { status: 500 }
    );
  }
}

function generateICS(events: any[]): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Legal Events//Legal Events Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:NYC Legal Events`,
    `X-WR-CALDESC:Legal events and networking opportunities in New York City`,
    `X-WR-TIMEZONE:America/New_York`,
    ''
  ];

  events.forEach(event => {
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    
    const startStr = startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endStr = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    ics.push(
      'BEGIN:VEVENT',
      `UID:${event.id}@lawyerevents.net`,
      `DTSTAMP:${timestamp}`,
      `DTSTART:${startStr}`,
      `DTEND:${endStr}`,
      `SUMMARY:${event.name}`,
      `DESCRIPTION:${event.description?.replace(/\n/g, '\\n') || ''}`,
      `LOCATION:${event.location?.name || ''}`,
      `URL:https://lawyerevents.net/events/${event.id}`,
      `STATUS:CONFIRMED`,
      'END:VEVENT'
    );
  });

  ics.push('END:VCALENDAR');
  
  return ics.join('\r\n');
}
```

### 1.2 Test Your Calendar Endpoint

Test the endpoints:
```
https://lawyerevents.net/api/events/calendar?format=ics
https://lawyerevents.net/api/events/calendar?format=json
```

## 📅 Step 2: Set Up Google Calendar

### 2.1 Create a Dedicated Google Calendar

1. **Go to [calendar.google.com](https://calendar.google.com)**
2. **Click the "+" button** next to "Other calendars"
3. **Select "Create new calendar"**
4. **Calendar details:**
   - **Name**: "NYC Legal Events"
   - **Description**: "Legal events and networking opportunities in New York City"
   - **Time zone**: America/New_York
5. **Click "Create calendar"**

### 2.2 Import Your Events

#### Option A: Direct ICS Import (Recommended)
1. **Go to your calendar settings**
2. **Click "Import & export"**
3. **Click "Import"**
4. **Choose file**: Download the ICS file from your API endpoint
5. **Select calendar**: Choose your "NYC Legal Events" calendar
6. **Click "Import"**

#### Option B: Subscribe to Live Calendar
1. **In Google Calendar, click the "+" button**
2. **Select "From URL"**
3. **Enter URL**: `https://lawyerevents.net/api/events/calendar?format=ics`
4. **Click "Add calendar"**

### 2.3 Set Up Automatic Updates

For live updates, you'll need to set up a scheduled job to update the calendar. Add this to your Next.js app:

```typescript
// src/app/api/events/sync-calendar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // This endpoint can be called by a cron job or manually
    // to refresh the Google Calendar
    
    const events = await prisma.event.findMany({
      where: {
        status: {
          in: ['approved', 'featured']
        }
      },
      include: {
        location: true,
        community: true,
      },
      orderBy: {
        startDate: 'asc'
      }
    });

    // Generate updated ICS content
    const icsContent = generateICS(events);
    
    // You could also use Google Calendar API here to directly update
    // the calendar, but ICS subscription is simpler
    
    return NextResponse.json({
      success: true,
      message: `Calendar synced with ${events.length} events`,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error syncing calendar:', error);
    return NextResponse.json(
      { error: 'Failed to sync calendar' },
      { status: 500 }
    );
  }
}
```

## 🎨 Step 3: Integrate with Squarespace

### 3.1 Add Google Calendar to Squarespace

#### Method 1: Calendar Block (Easiest)
1. **Go to your Squarespace page**
2. **Add a new block**
3. **Select "Calendar"**
4. **Choose "Google Calendar"**
5. **Enter your Google Calendar ID** (found in calendar settings)
6. **Configure display options**

#### Method 2: Embed Code
1. **In Google Calendar, go to settings**
2. **Click on your "NYC Legal Events" calendar**
3. **Scroll down to "Integrate calendar"**
4. **Copy the embed code**
5. **In Squarespace, add a "Code" block**
6. **Paste the embed code**

### 3.2 Customize the Display

Add custom CSS to make the calendar look better:

```css
/* Add to Squarespace Code Injection → Header */
<style>
/* Google Calendar Customization */
.gcal-embed {
  border: none;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

/* Event cards styling */
.gcal-event {
  background: #f8f9fa;
  border-left: 4px solid #3498db;
  padding: 12px;
  margin: 8px 0;
  border-radius: 6px;
}

.gcal-event-title {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.gcal-event-time {
  color: #7f8c8d;
  font-size: 0.9em;
}

.gcal-event-location {
  color: #e74c3c;
  font-size: 0.9em;
}
</style>
```

## 🔄 Step 4: Set Up Automatic Sync

### 4.1 GitHub Actions (Recommended)

Create a GitHub Action to sync your calendar daily:

```yaml
# .github/workflows/calendar-sync.yml
name: Sync Calendar

on:
  schedule:
    - cron: '0 6 * * *' # Run daily at 6 AM UTC
  workflow_dispatch: # Allow manual trigger

jobs:
  sync-calendar:
    runs-on: ubuntu-latest
    steps:
      - name: Sync Calendar
        run: |
          curl -X POST https://lawyerevents.net/api/events/sync-calendar \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${{ secrets.API_TOKEN }}"
```

### 4.2 Vercel Cron Jobs

If using Vercel, add this to your `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/events/sync-calendar",
      "schedule": "0 6 * * *"
    }
  ]
}
```

## 📱 Step 5: Mobile and Sharing

### 5.1 Mobile Calendar App
- **Users can subscribe** to your Google Calendar
- **Events appear** in their phone's calendar app
- **Automatic notifications** for upcoming events
- **Offline access** to event details

### 5.2 Sharing Options
- **Public calendar link** for easy sharing
- **Embed in websites** (including Squarespace)
- **Export to other calendar apps** (Outlook, Apple Calendar, etc.)

## 🎯 Step 6: Advanced Features

### 6.1 Event Categories
Set up different calendars for different event types:
- **CLE Events**
- **Networking Events**
- **Conferences**
- **Workshops**

### 6.2 RSVP Integration
Use Google Calendar's built-in RSVP features:
- **Event responses** (Yes/No/Maybe)
- **Attendee management**
- **Email notifications**

### 6.3 Analytics
Track calendar engagement:
- **Views per event**
- **RSVP rates**
- **Popular event types**

## 🔧 Step 7: Maintenance

### 7.1 Regular Tasks
- **Monitor calendar sync** (check for failed updates)
- **Review event accuracy** (ensure all events are correct)
- **Update calendar settings** as needed
- **Backup calendar data** periodically

### 7.2 Troubleshooting
- **Events not appearing**: Check API endpoint and calendar permissions
- **Sync issues**: Verify cron jobs are running
- **Display problems**: Check Squarespace embed settings

## 🎉 Benefits of This Approach

✅ **Simple Setup** - No complex API integrations  
✅ **Reliable** - Google handles the infrastructure  
✅ **Familiar** - Everyone knows Google Calendar  
✅ **Mobile Friendly** - Works on all devices  
✅ **Automatic Updates** - Changes sync automatically  
✅ **Free** - No additional costs  
✅ **Scalable** - Handles any number of events  
✅ **Accessible** - Works with screen readers and assistive technology  

## 🚀 Quick Start Checklist

- [ ] Create Google Calendar API endpoint in Next.js
- [ ] Set up dedicated Google Calendar
- [ ] Import events from your backend
- [ ] Add calendar to Squarespace
- [ ] Set up automatic sync
- [ ] Test on mobile devices
- [ ] Share calendar with users

This approach gives you a professional, reliable calendar integration without the complexity of building custom API integrations. Users get a familiar Google Calendar experience, and you get automatic sync and mobile support!
