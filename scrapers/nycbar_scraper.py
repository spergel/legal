import json
import logging
import hashlib
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
from email.utils import parsedate_to_datetime

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
            parts = [x.strip() for x in eyebrow.split('|')]
            if len(parts) >= 3:
                date, time, event_type = parts[0], parts[1], parts[2]
            else:
                date, time, event_type = parts[0] if len(parts) > 0 else "", parts[1] if len(parts) > 1 else "", parts[2] if len(parts) > 2 else ""
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
            # Parse date and time - handle various formats
            try:
                # Try different date formats that might be used
                date_formats = [
                    '%B %d, %Y',  # "September 26, 2025"
                    '%a, %b %d, %Y',  # "Fri, Sep 26, 2025"
                    '%Y-%m-%d',  # "2025-09-26"
                ]

                date_obj = None
                for fmt in date_formats:
                    try:
                        date_obj = datetime.strptime(date, fmt)
                        break
                    except ValueError:
                        continue

                if date_obj is None:
                    logger.error(f"Could not parse date: {date}")
                    return None

                # Parse time range (e.g., "9 AM-5 PM")
                if '-' in time:
                    start_time_str, end_time_str = time.split('-')
                    start_time_str = start_time_str.strip()
                    end_time_str = end_time_str.strip()

                    # Parse start time
                    try:
                        if 'AM' in start_time_str or 'PM' in start_time_str:
                            start_time = datetime.strptime(start_time_str, '%I %p')
                        else:
                            start_time = datetime.strptime(start_time_str, '%H:%M')

                        date_obj = date_obj.replace(hour=start_time.hour, minute=start_time.minute)
                        start_date = date_obj.isoformat()

                        # Parse end time
                        if 'AM' in end_time_str or 'PM' in end_time_str:
                            end_time = datetime.strptime(end_time_str, '%I %p')
                        else:
                            end_time = datetime.strptime(end_time_str, '%H:%M')

                        end_date_obj = date_obj.replace(hour=end_time.hour, minute=end_time.minute)
                        # Handle case where end time is next day
                        if end_time.hour < start_time.hour:
                            end_date_obj = end_date_obj.replace(day=end_date_obj.day + 1)
                        end_date = end_date_obj.isoformat()

                    except ValueError as e:
                        logger.error(f"Error parsing time range '{time}': {e}")
                        # Fallback: assume 1 hour duration
                        start_date = date_obj.isoformat()
                        end_date = (date_obj.replace(hour=date_obj.hour + 1)).isoformat()
                else:
                    # Single time (assume 1 hour duration)
                    try:
                        if 'AM' in time or 'PM' in time:
                            time_obj = datetime.strptime(time, '%I %p')
                        else:
                            time_obj = datetime.strptime(time, '%H:%M')

                        date_obj = date_obj.replace(hour=time_obj.hour, minute=time_obj.minute)
                        start_date = date_obj.isoformat()
                        end_date = (date_obj.replace(hour=date_obj.hour + 1)).isoformat()
                    except ValueError as e:
                        logger.error(f"Error parsing single time '{time}': {e}")
                        start_date = date_obj.isoformat()
                        end_date = (date_obj.replace(hour=date_obj.hour + 1)).isoformat()

            except Exception as e:
                logger.error(f"Error parsing date/time '{date}' / '{time}': {e}")
                return None
            # Determine event type and categories using helper
            event_type = self._determine_event_type(title, description)
            
            # Use centralized categorization
            base_categories = ['Bar Association', 'Legal Events']
            categories = EventCategorizer.categorize_event(title, description, base_categories)
            # Create standardized event
            return Event(
                id=f"nycbar_{hashlib.sha256(registration_url.encode('utf-8')).hexdigest()[:10]}",
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
                    start_iso = None
                    end_iso = None
                    # Expected format example: "Mon, Sep 8, 2025 | 2-5:05 PM | CLE"
                    if date_str and '|' in date_str:
                        try:
                            parts = [p.strip() for p in date_str.split('|') if p.strip()]
                            # parts[0]=date, parts[1]=time range
                            date_part = parts[0]
                            time_part = parts[1] if len(parts) > 1 else ''
                            # Parse date portion allowing optional weekday
                            # Try formats with and without leading weekday
                            dt_date = None
                            for fmt in ['%a, %b %d, %Y', '%b %d, %Y']:
                                try:
                                    dt_date = datetime.strptime(date_part, fmt)
                                    break
                                except ValueError:
                                    continue
                            # Parse time range like "2-5:05 PM" or "5:45-9 PM" or "9 AM-5 PM"
                            if dt_date and time_part:
                                import re as _re
                                # Updated regex to handle formats like "9 AM-5 PM"
                                m = _re.search(r"^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?\s*-\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$", time_part, _re.IGNORECASE)
                                if m:
                                    sh, sm, sh_ampm, eh, em, eh_ampm = m.groups()
                                    sh = int(sh)
                                    eh = int(eh)
                                    sm = int(sm) if sm else 0
                                    em = int(em) if em else 0

                                    # Apply AM/PM conversion for start time
                                    if sh_ampm:
                                        if sh_ampm.upper() == 'PM' and sh != 12:
                                            sh += 12
                                        elif sh_ampm.upper() == 'AM' and sh == 12:
                                            sh = 0

                                    # Apply AM/PM conversion for end time
                                    if eh_ampm:
                                        if eh_ampm.upper() == 'PM' and eh != 12:
                                            eh += 12
                                        elif eh_ampm.upper() == 'AM' and eh == 12:
                                            eh = 0
                                    # If no AM/PM specified for end time but specified for start, use same
                                    elif sh_ampm:
                                        if sh_ampm.upper() == 'PM' and eh != 12:
                                            eh += 12
                                        elif sh_ampm.upper() == 'AM' and eh == 12:
                                            eh = 0

                                    start_dt = dt_date.replace(hour=sh, minute=sm, second=0, microsecond=0)
                                    end_dt = dt_date.replace(hour=eh, minute=em, second=0, microsecond=0)
                                    start_iso = start_dt.isoformat()
                                    end_iso = end_dt.isoformat()
                                else:
                                    # Fallback: single time like "2:00 PM" or "9 AM"
                                    for t_fmt in ['%I:%M %p', '%I %p', '%I%p']:
                                        try:
                                            t = datetime.strptime(time_part.strip(), t_fmt)
                                            start_dt = dt_date.replace(hour=t.hour, minute=t.minute, second=0, microsecond=0)
                                            start_iso = start_dt.isoformat()
                                            end_iso = None
                                            break
                                        except ValueError:
                                            continue
                        except Exception as e:
                            logger.warning(f"Failed to parse NYC Bar date string '{date_str}': {e}")
                    # Fallback: try to parse date from elsewhere if needed
                    # Description (not available in list, would need to fetch detail page if needed)
                    description = None
                    # Create event object (minimal for now)
                    event = Event(
                        id=f"nycbar_{hashlib.sha256(link.encode('utf-8')).hexdigest()[:10]}",
                        name=title,
                        description=description,
                        startDate=start_iso or date_str,
                        endDate=end_iso,
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