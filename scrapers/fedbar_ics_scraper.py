import logging
from datetime import datetime, timezone
from typing import List, Optional
import requests
from ics import Calendar, Event as ICSEvent

from .base_scraper import BaseScraper
from .models import Event
from .categorization_helper import EventCategorizer
from .calendar_configs import ICS_CALENDARS
import json
import re

logger = logging.getLogger(__name__)

class FBAICSScraper(BaseScraper):
    """ICS scraper for Federal Bar Association events using the ics library."""
    def __init__(self, community_id="com_fedbar"):
        super().__init__()
        self.community_id = community_id
        # The FBA calendar seems to be missing from the new config, this will need to be added
        self.url = "https://www.fedbar.org/events/list/?ical=1" # Placeholder
        self.ics_url = "https://www.fedbar.org/events/?ical=1"

    def clean_html(self, html_content: str) -> str:
        if not html_content:
            return ""
        import html
        text = html.unescape(html_content)
        text = re.sub(r'<[^>]+>', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    def determine_event_type(self, name: str, description: str, categories: List[str]) -> str:
        text_to_check = f"{name} {' '.join(categories or [])} {description}".lower()
        if 'webinar' in text_to_check:
            return 'Webinar'
        elif 'cle' in text_to_check or 'continuing legal education' in text_to_check:
            return 'CLE'
        elif 'conference' in text_to_check:
            return 'Conference'
        elif 'luncheon' in text_to_check or 'lunch' in text_to_check:
            return 'Luncheon'
        elif 'dinner' in text_to_check or 'gala' in text_to_check:
            return 'Dinner/Gala'
        elif 'summit' in text_to_check:
            return 'Summit'
        elif 'panel' in text_to_check:
            return 'Panel Discussion'
        elif 'bagels' in text_to_check or 'breakfast' in text_to_check:
            return 'Breakfast'
        elif 'reception' in text_to_check:
            return 'Reception'
        elif 'meeting' in text_to_check:
            return 'Meeting'
        else:
            return 'Event'

    def extract_cle_credits(self, name: str, description: str) -> Optional[float]:
        text_to_check = f"{name} {description}".lower()
        cle_patterns = [
            r'(\d+(?:\.\d+)?)\s*cle\s*credit',
            r'(\d+(?:\.\d+)?)\s*credit\s*hour',
            r'(\d+(?:\.\d+)?)\s*hour\s*cle',
            r'(\d+(?:\.\d+)?)\s*general\s*cle',
            r'(\d+(?:\.\d+)?)\s*ceu'
        ]
        for pattern in cle_patterns:
            match = re.search(pattern, text_to_check)
            if match:
                try:
                    return float(match.group(1))
                except ValueError:
                    continue
        return None

    def get_events(self) -> List[Event]:
        events = []
        try:
            response = self.session.get(self.ics_url)
            response.raise_for_status()
            cal = Calendar(response.text)
            for event in cal.events:
                try:
                    summary = event.name or ''
                    description = event.description or ''
                    description_clean = self.clean_html(description)
                    start_date = event.begin.to('local').isoformat() if event.begin else None
                    end_date = event.end.to('local').isoformat() if event.end else None
                    url = event.url if hasattr(event, 'url') else ''
                    location = event.location or ''
                    # Use centralized categorization
                    base_categories = ['Federal Bar', 'Bar Association', 'Legal Events']
                    categories = list(event.categories) if hasattr(event, 'categories') and event.categories else []
                    if categories:
                        base_categories.extend(categories)
                    event_categories = EventCategorizer.categorize_event(summary, description_clean, base_categories)
                    event_id = event.uid if hasattr(event, 'uid') and event.uid else summary.lower().replace(' ', '-')
                    event_type = self.determine_event_type(summary, description_clean, event_categories)
                    cle_credits = self.extract_cle_credits(summary, description_clean)
                    attachments = []  # ics library does not expose attachments directly
                    event_obj = Event(
                        id=event_id,
                        name=summary,
                        description=description_clean,
                        startDate=start_date,
                        endDate=end_date,
                        locationId=None,
                        communityId=None,
                        image=None,
                        price=None,
                        metadata={
                            'source': 'fedbar_ics',
                            'event_url': url,
                            'location': location,
                            'categories': event_categories,
                            'uid': event_id,
                            'attachments': attachments,
                        },
                        category=event_categories,
                        tags=event_categories,
                        event_type=event_type,
                        cle_credits=cle_credits
                    )
                    events.append(event_obj)
                    logger.debug(f"Processed event: {summary}")
                except Exception as e:
                    logger.error(f"Error processing event {getattr(event, 'name', 'unknown')}: {e}")
                    continue
        except Exception as e:
            logger.error(f"Error fetching events from FBA ICS: {e}")
        return events

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    scraper = FBAICSScraper()
    events = scraper.get_events()
    print(f"Scraped {len(events)} events from Federal Bar Association")
    print(f"Events saved to scrapers/data/")
    print(json.dumps([event.to_dict() for event in events], indent=2)) 