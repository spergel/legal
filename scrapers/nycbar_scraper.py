import json
import logging
from datetime import datetime
from typing import List, Optional
import requests
from bs4 import BeautifulSoup
import time
import re
import os
from .base_scraper import BaseScraper
from .models import Event
from .categorization_helper import EventCategorizer
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

class NYCBarScraper(BaseScraper):
    """Scraper for NYC Bar Association events."""
    
    BASE_URL = "https://www.nycbar.org/wp-admin/admin-ajax.php"
    EVENTS_URL = "https://www.nycbar.org/events/"
    
    def __init__(self, community_id: str):
        super().__init__(community_id)
        self.session.headers.update({
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'X-Requested-With': 'XMLHttpRequest',
        })
        self.base_url = "https://www.nycbar.org"
        self.events_url = f"{self.base_url}/events"

    def get_event_description(self, event_url: str) -> Optional[str]:
        """Get the full description of an event by visiting its page."""
        try:
            response = self.session.get(event_url)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            description_div = soup.find('div', class_='Description')
            if description_div:
                return description_div.get_text(strip=True)
            return None
        except Exception as e:
            logger.error(f"Error fetching event description from {event_url}: {e}")
            return None

    def parse_event(self, article_html: str) -> Optional[Event]:
        """Parse an event from HTML article element."""
        try:
            soup = BeautifulSoup(article_html, 'html.parser')
            # Extract event details
            eyebrow = soup.find('div', class_='event-eyebrow').text.strip()
            date, time, event_type = [x.strip() for x in eyebrow.split('|')]
            title = soup.find('h3').text.strip()
            register_link = soup.find('a', class_='register')
            registration_url = register_link['href']
            # Get full description
            description = self.get_event_description(registration_url)
            # Extract CLE credits
            cle_credits = None
            if description:
                cle_match = re.search(r'(\d+(?:\.\d+)?\s+CLE\s+credits)', description, re.IGNORECASE)
                if cle_match:
                    cle_credits = cle_match.group(1)
            # Extract location
            location_name = None
            location_div = soup.find('div', class_='event-location')
            if location_div:
                location_name = location_div.text.strip()
            # Extract price information
            price = None
            price_details = None
            if description:
                price_match = re.search(r'\$(\d+(?:\.\d{2})?)', description)
                if price_match:
                    try:
                        amount = float(price_match.group(1))
                        price = {
                            'type': 'paid' if amount > 0 else 'free',
                            'amount': amount,
                            'currency': 'USD'
                        }
                        # Get price details
                        price_details_match = re.search(r'(?:Price|Cost|Fee):\s*([^\n]+)', description, re.IGNORECASE)
                        if price_details_match:
                            price['details'] = price_details_match.group(1).strip()
                    except ValueError:
                        pass
            # Parse date and time
            try:
                date_obj = datetime.strptime(f"{date} {time}", '%B %d, %Y %I:%M %p')
                start_date = date_obj.isoformat()
                # Assume 1 hour duration if not specified
                end_date = (date_obj.replace(hour=date_obj.hour + 1)).isoformat()
            except ValueError as e:
                logger.error(f"Error parsing date/time: {e}")
                return None
            # Determine event type and categories using helper
            event_type = self._determine_event_type(title, description)
            
            # Use centralized categorization
            base_categories = ['Bar Association', 'Legal Events']
            categories = EventCategorizer.categorize_event(title, description, base_categories)
            # Create standardized event
            return Event(
                id=f"nycbar_{hash(registration_url)}",
                name=title,
                description=description,
                startDate=start_date,
                endDate=end_date,
                communityId=self.community_id,
                metadata={
                    'cle_credits': cle_credits,
                    'source_url': registration_url,
                    'venue': {
                        'name': location_name,
                        'type': 'in-person' if 'In-person' in event_type else 'webinar'
                    }
                },
                price=price,
                category=categories,
                tags=['CLE'] if cle_credits else None
            )
        except Exception as e:
            logger.error(f"Error parsing event: {e}")
            return None

    def get_events(self) -> List[Event]:
        """Get events from the NYC Bar Association website."""
        try:
            response = self.session.get(self.events_url)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            events = []
            # Updated selector for new site structure
            event_containers = soup.find_all('article', class_='card event-card')
            if not event_containers:
                print("[DEBUG] No event containers found with selector 'article.card.event-card'")
            for container in event_containers:
                try:
                    # Title
                    title_elem = container.find('h2') or container.find('h3')
                    if not title_elem:
                        continue
                    title = title_elem.text.strip()
                    # Registration link
                    register_link = container.find('a', class_='register')
                    if not register_link or not register_link.get('href'):
                        continue
                    link = register_link['href']
                    # Date (from event-eyebrow or similar)
                    eyebrow_elem = container.find('div', class_='event-eyebrow')
                    date_str = eyebrow_elem.text.strip() if eyebrow_elem else None
                    # Fallback: try to parse date from elsewhere if needed
                    # Description (not available in list, would need to fetch detail page if needed)
                    description = None
                    # Create event object (minimal for now)
                    event = Event(
                        id=f"nycbar_{hash(link)}",
                        name=title,
                        description=description,
                        startDate=date_str,
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
                except Exception as e:
                    print(f"Error processing event: {e}")
                    continue
            return events
        except Exception as e:
            print(f"Error fetching events: {e}")
            return []



def main():
    """Main function to run the scraper."""
    scraper = NYCBarScraper(community_id='com_nycbar')
    events = scraper.run()
    print(f"Scraped {len(events)} events")

if __name__ == "__main__":
    main() 