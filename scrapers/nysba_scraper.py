from datetime import datetime, timedelta
import logging
import re
from typing import List, Optional, Dict, Any
import requests
from bs4 import BeautifulSoup

from .base_scraper import BaseScraper
from .models import Event
from .categorization_helper import EventCategorizer
import json
import hashlib

logger = logging.getLogger(__name__)

class NYSBAScraper(BaseScraper):
    """
    Scraper for New York State Bar Association (NYSBA) events.
    Fetches events from the NYSBA's live programs page.
    """
    def __init__(self, community_id="com_nysba"):
        super().__init__(community_id)
        self.url = "https://nysba.org/wp-json/events/v1/cal-list"

    def get_events(self) -> List[Event]:
        events = []
        try:
            headers = {
                'Accept': 'application/json, text/plain, */*',
                'Referer': 'https://nysba.org/events-calendar/',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15'
            }
            response = requests.get(self.url, headers=headers)
            response.raise_for_status()
            data = response.json()

            events_list = data.get('events', [])
            if not events_list:
                logger.info("NYSBA scraper found no events in the 'events' key.")
                return []

            today = datetime.now().date()
            three_months_from_now = today + timedelta(days=90)

            for event_data in events_list:
                try:
                    start_date_str = event_data.get('start')
                    if not start_date_str:
                        continue

                    start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()

                    # Filter out past events and events more than 3 months in the future
                    if not (today <= start_date <= three_months_from_now):
                        continue

                    event_id = f"nysba-{event_data.get('id')}"
                    name = event_data.get('title')
                    event_url = event_data.get('url')
                    
                    if not all([event_id, name, event_url]):
                        logger.warning(f"Skipping event with missing data: {event_data}")
                        continue

                    event = Event(
                        id=event_id,
                        name=name,
                        startDate=start_date.isoformat(),
                        url=event_url,
                        communityId=self.community_id,
                        description=f"Event at {event_data.get('region', 'N/A')}",
                        event_type=event_data.get('className')[0] if event_data.get('className') else 'Unknown'
                    )
                    events.append(event)
                except Exception as e:
                    logger.error(f"Error processing NYSBA event: {e}", exc_info=True)
            
            logger.info(f"Successfully scraped {len(events)} events from NYSBA after filtering")

        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching events from NYSBA API: {e}")
        except Exception as e:
            logger.error(f"An unexpected error occurred in NYSBA scraper: {e}", exc_info=True)
            
        return events
    
    def _parse_event(self, event_data: Dict[str, Any]) -> Event:
        try:
            event_id = str(event_data.get('id', ''))
            name = event_data.get('title', '').strip()
            description = event_data.get('excerpt', '').strip()
            permalink = event_data.get('permalink', '')
            date_str = event_data.get('date', '')
            startDate = None
            if date_str:
                try:
                    event_date = datetime.strptime(date_str, '%m/%d/%Y')
                    startDate = event_date.isoformat()
                except ValueError:
                    logger.warning(f"Could not parse date '{date_str}' for event {event_id}")
            image_url = None
            if 'image' in event_data and event_data['image']:
                image_url = event_data['image'].get('src', '')
            member_price = event_data.get('memberPrice', '')
            credits = event_data.get('credits', {})
            cle_credits = 0.0
            if 'totalCredits' in credits and credits['totalCredits']:
                try:
                    cle_credits = float(credits['totalCredits'].get('val', 0))
                except (ValueError, TypeError):
                    cle_credits = 0.0
            event_types = [et.get('termName', '') for et in event_data.get('eventTypes', []) if et.get('termName')]
            event_format = [ef.get('termName', '') for ef in event_data.get('eventFormat', []) if ef.get('termName')]
            practice_areas = [pa.get('termName', '') for pa in event_data.get('practiceArea', []) if pa.get('termName')]
            event_type = "CLE" if any("CLE" in et for et in event_types) else "Event"
            # Compose metadata
            metadata = {
                'permalink': permalink,
                'cle_credits': cle_credits,
                'event_types': event_types,
                'event_format': event_format,
                'practice_areas': practice_areas,
            }
            event = Event(
                id=f"nysba_{event_id}",
                name=name,
                description=description,
                startDate=startDate or "",
                endDate=None,
                locationId=None,
                communityId="com_nysba",
                image=image_url,
                price={"member": member_price} if member_price else None,
                metadata=metadata,
                category=[event_type],
                tags=event_types + event_format + practice_areas
            )
            return event
        except Exception as e:
            logger.error(f"Error parsing event data: {e}")
            return None

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    scraper = NYSBAScraper()
    events = scraper.get_events()
    print(json.dumps([event.to_dict() for event in events], indent=2))
    print(f"Scraped {len(events)} events from NYSBA")
    print(f"Events saved to scrapers/data/") 