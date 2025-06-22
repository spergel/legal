import requests
from datetime import datetime
from typing import List, Optional
from base_scraper import BaseScraper
from models import Event
import logging
import re
from icalendar import Calendar
from categorization_helper import EventCategorizer

logger = logging.getLogger(__name__)

class HNBAICSScraper(BaseScraper):
    """ICS scraper for Hispanic National Bar Association events."""
    def __init__(self):
        super().__init__("com_hnba")
        self.ics_url = "https://tockify.com/api/feeds/ics/hnbacalendar"

    def parse_dt(self, dt) -> Optional[str]:
        if not dt:
            return None
        if isinstance(dt, datetime):
            return dt.isoformat()
        try:
            # Try to parse as string
            return datetime.strptime(str(dt), "%Y%m%dT%H%M%SZ").isoformat()
        except Exception:
            try:
                return datetime.strptime(str(dt), "%Y%m%d").isoformat()
            except Exception:
                return str(dt)

    def get_events(self) -> List[Event]:
        events = []
        try:
            response = self.session.get(self.ics_url)
            response.raise_for_status()
            cal = Calendar.from_ical(response.content)
            logger.info(f"Loaded ICS feed for HNBA")
            for component in cal.walk():
                if component.name == "VEVENT":
                    try:
                        title = str(component.get('SUMMARY', ''))
                        description = str(component.get('DESCRIPTION', ''))
                        url = str(component.get('URL', ''))
                        start = self.parse_dt(component.get('DTSTART').dt) if component.get('DTSTART') else None
                        end = self.parse_dt(component.get('DTEND').dt) if component.get('DTEND') else None
                        uid = str(component.get('UID', ''))
                        categories = component.get('CATEGORIES')
                        category = []
                        if categories:
                            if hasattr(categories, 'cats'):
                                category = [str(cat) for cat in categories.cats]
                            else:
                                category = [str(categories)]
                        
                        # Try to extract CLE info from description
                        cle_credits = None
                        cle_match = re.search(r'(\d+(?:\.\d+)?)\s+CLE', description, re.IGNORECASE)
                        if cle_match:
                            cle_credits = float(cle_match.group(1))
                        
                        # Determine event type
                        event_type = 'CLE' if 'CLE' in title.upper() or 'CLE' in description.upper() else 'Event'
                        
                        # Use centralized categorization
                        base_categories = ['Bar Association', 'Legal Events', 'Hispanic']
                        if category:
                            base_categories.extend(category)
                        event_categories = EventCategorizer.categorize_event(title, description, base_categories)
                        
                        event = Event(
                            id=uid or f"hnba_{hash(title)}",
                            name=title,
                            description=description,
                            startDate=start or "",
                            endDate=end,
                            locationId=None,
                            communityId="com_hnba",
                            image=None,
                            price=None,
                            metadata={
                                "source_url": self.ics_url,
                                "event_link": url
                            },
                            category=event_categories,
                            tags=None,
                            event_type=event_type,
                            cle_credits=cle_credits
                        )
                        events.append(event)
                        logger.info(f"Added event: {title} ({start})")
                    except Exception as e:
                        logger.error(f"Error parsing event: {e}")
                        continue
            logger.info(f"Scraped {len(events)} events from HNBA ICS feed")
        except Exception as e:
            logger.error(f"Error fetching HNBA ICS feed: {e}")
        return events



if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    scraper = HNBAICSScraper()
    events = scraper.run()
    print(f"Scraped {len(events)} events from HNBA ICS feed")
    print(f"Events saved to scrapers/data/") 
    logging.basicConfig(level=logging.INFO)
    scraper = HNBAICSScraper()
    events = scraper.run()
    print(f"Scraped {len(events)} events from HNBA ICS feed")
    print(f"Events saved to scrapers/data/") 