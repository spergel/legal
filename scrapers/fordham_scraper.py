import json
import logging
from datetime import datetime
from typing import List, Optional
import requests
from bs4 import BeautifulSoup
import re
import os
from .base_scraper import BaseScraper
from .models import Event
import feedparser
from dotenv import load_dotenv
from .academic_event_filter import academic_filter
from email.utils import parsedate_to_datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
load_dotenv(os.path.join(PROJECT_ROOT, '.env.local'))

class FordhamScraper(BaseScraper):
    """Scraper for Fordham Law events via RSS feed."""
    
    def __init__(self, community_id: str):
        super().__init__(community_id)
        self.rss_url = "https://go.activecalendar.com/FordhamUniversity/site/law/page/rss/?duration=180days"
    
    def get_events(self) -> List[Event]:
        """Get events from the Fordham Law website."""
        events = []
        feed = feedparser.parse(self.rss_url)
        
        logger.info(f"Processing {len(feed.entries)} events from Fordham RSS feed")
        
        for entry in feed.entries:
            try:
                title = entry.title
                link = entry.link
                description = getattr(entry, 'summary', None)
                start_date_raw = getattr(entry, 'published', None) or getattr(entry, 'updated', None)
                start_iso = None
                if isinstance(start_date_raw, str) and start_date_raw:
                    try:
                        # RSS dates like 'Mon, 08 Sep 2025 16:30:00 GMT'
                        dt = parsedate_to_datetime(start_date_raw)
                        # Ensure UTC ISO without microseconds
                        if dt.tzinfo is None:
                            start_iso = dt.replace(tzinfo=None).isoformat() + 'Z'
                        else:
                            start_iso = dt.astimezone().isoformat()
                    except Exception:
                        start_iso = start_date_raw
                
                # Filter out internal academic events using shared filter
                if academic_filter.is_internal_academic_event(title, description):
                    continue
                
                event = Event(
                    id=f"fordham_{hash(link)}",
                    name=title,
                    description=description,
                    startDate=start_iso or start_date_raw,
                    endDate=None,
                    locationId=None,
                    communityId=self.community_id,
                    image=None,
                    price=None,
                    metadata={"source_url": link},
                    category=["Legal"],
                    tags=None
                )
                events.append(event)
                logger.info(f"Added public event: '{title}'")
                
            except Exception as e:
                logger.error(f"Error processing Fordham event: {e}")
                continue
        
        logger.info(f"Filtered to {len(events)} public events from {len(feed.entries)} total events")
        return events

def main():
    """Main function to run the scraper."""
    scraper = FordhamScraper(community_id='com_fordham_law')
    events = scraper.run()
    print(f"Scraped {len(events)} events")

if __name__ == "__main__":
    main() 