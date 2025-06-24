import logging
from datetime import datetime
from typing import List, Optional
import requests
from ics import Calendar

from .base_scraper import BaseScraper
from .models import Event
from .categorization_helper import EventCategorizer
from .calendar_configs import ICS_CALENDARS
import json
import re

logger = logging.getLogger(__name__)

class HNBAICSScraper(BaseScraper):
    """ICS scraper for Hispanic National Bar Association events."""
    def __init__(self, community_id="com_hnba"):
        super().__init__()
        self.community_id = community_id
        self.url = "https://tockify.com/api/feeds/ics/hnbacalendar"

    def get_events(self) -> List[Event]:
        events = []
        try:
            response = requests.get(self.url)
            response.raise_for_status()
            
            # Pre-process the ICS data to remove the problematic line
            lines = response.text.splitlines()
            filtered_lines = [line for line in lines if not line.startswith('X-TKF-PROMOTION-BUTTON')]
            ics_text = "\n".join(filtered_lines)

            cal = Calendar(ics_text)
            logger.info(f"Loaded ICS feed for HNBA")
            for component in cal.events:
                try:
                    event = Event(
                    id=f"hnba_{component.uid}",
                    name=str(component.name),
                    description=str(component.description),
                    url=str(component.url),
                    startDate=component.begin.isoformat(),
                    endDate=component.end.isoformat() if component.end else None,
                    communityId=self.community_id,
                    locationId=str(component.location) if component.location else "Unknown",
                    tags=[],
                    event_type="Unknown",
                    category="Unknown"
                    )
                    events.append(event)
                except Exception as e:
                    logger.error(f"Error parsing HNBA event: {e}")
        except requests.RequestException as e:
            logger.error(f"Error fetching HNBA ICS feed: {e}")
        except Exception as e:
            logger.error(f"An unexpected error occurred in HNBA scraper: {e}")
            
        logger.info(f"Successfully scraped {len(events)} events from HNBA")
        return events

if __name__ == '__main__':
    scraper = HNBAICSScraper()
    events = scraper.get_events()
    print(json.dumps([event.to_dict() for event in events], indent=2)) 