from workers import WorkerEntrypoint, Response
import json
from datetime import datetime, timezone

# Embedded events data - will be updated by the scraper runner
EVENTS_DATA = [
    {
        "id": "sample_1",
        "title": "Sample Legal Event",
        "description": "This is a sample event for testing purposes",
        "start": "2025-01-15T10:00:00Z",
        "end": "2025-01-15T12:00:00Z",
        "location": "Virtual",
        "url": "https://example.com",
        "category": ["Legal"],
        "tags": ["sample"],
        "event_type": "webinar",
        "cle_credits": 1.0,
        "community": "sample",
        "status": "approved"
    }
]

class ScraperWorkerEntrypoint(WorkerEntrypoint):
    async def on_fetch(self, request):
        url = str(request.url)

        # Health check
        if "/health" in url:
            return Response(json.dumps({
                "status": "healthy",
                "service": "Legal Events Scraper Worker",
                "version": "1.0.0",
                "total_events": len(EVENTS_DATA),
                "last_updated": getattr(self, 'last_updated', 'unknown')
            }), headers={"Content-Type": "application/json"})

        # Manual trigger endpoint
        elif "/scrape" in url:
            # In a real implementation, this would trigger the scraper pipeline
            # For now, return instructions
            return Response(json.dumps({
                "message": "Manual scraping triggered",
                "instructions": "Run 'python run_all_scrapers.py' locally to update events data, then redeploy the worker",
                "status": "pending"
            }), headers={"Content-Type": "application/json"})

        # RSS feed
        elif "/rss" in url:
            return Response(self.generate_rss(), headers={"Content-Type": "application/rss+xml"})

        # Calendar (ICS) feed
        elif "/calendar" in url:
            return Response(self.generate_ics(), headers={"Content-Type": "text/calendar"})

        # Events API
        elif "/events" in url:
            events = self.get_events()
            return Response(json.dumps({
                "success": True,
                "data": events,
                "total_events": len(events),
                "last_updated": getattr(self, 'last_updated', 'unknown')
            }), headers={"Content-Type": "application/json"})

        # Default response
        else:
            return Response("Legal Events Scraper API - Endpoints: /health, /scrape, /rss, /calendar, /events")

    def get_events(self):
        """Get all events from embedded data"""
        return EVENTS_DATA

    def generate_rss(self):
        events = self.get_events()
        now = datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S GMT")

        items = ""
        for event in events[:50]:  # Limit to 50 events for RSS
            items += f"""
    <item>
        <title>{event['title']}</title>
        <description>{event['description']}</description>
        <link>{event['url']}</link>
        <guid>{event['id']}</guid>
        <pubDate>{now}</pubDate>
    </item>"""

        return f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
    <channel>
        <title>NYC Legal Events</title>
        <description>Legal events and networking opportunities</description>
        <link>https://legal-events-calendar.spergel-joshua.workers.dev</link>
        <lastBuildDate>{now}</lastBuildDate>
        {items}
    </channel>
</rss>"""

    def generate_ics(self):
        events = self.get_events()
        now = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')

        vevents = ""
        for event in events[:50]:  # Limit to 50 events for ICS
            try:
                start = event['start'].replace('-', '').replace(':', '')[:15] + 'Z'
                end = event['end'].replace('-', '').replace(':', '')[:15] + 'Z'

                vevents += f"""
BEGIN:VEVENT
UID:{event['id']}@legal-events.workers.dev
DTSTAMP:{now}
DTSTART:{start}
DTEND:{end}
SUMMARY:{event['title']}
DESCRIPTION:{event['description']}
LOCATION:{event['location']}
URL:{event['url']}
STATUS:CONFIRMED
END:VEVENT"""
            except Exception as e:
                print(f"Error processing event {event.get('id', 'unknown')}: {e}")
                continue

        return f"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Legal Events//Legal Events Scraper Worker//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:NYC Legal Events
X-WR-CALDESC:Legal events and networking opportunities
{vevents}
END:VCALENDAR"""

