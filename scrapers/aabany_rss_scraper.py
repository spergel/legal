import requests
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import List, Optional
from base_scraper import BaseScraper
from models import Event
import logging
import re
from bs4 import BeautifulSoup
from categorization_helper import EventCategorizer

logger = logging.getLogger(__name__)

class AABANYRSSScraper(BaseScraper):
    """RSS scraper for Asian American Bar Association of New York events."""
    def __init__(self):
        super().__init__("com_aabany")
        self.rss_url = "https://cdn.ymaws.com/www.aabany.org/resource/rss/events.rss"

    def clean_html(self, html_content: str) -> str:
        """Clean HTML content and extract plain text."""
        if not html_content:
            return ""
        
        # Parse HTML and extract text
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
        
        # Get text and clean up whitespace
        text = soup.get_text()
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = ' '.join(chunk for chunk in chunks if chunk)
        
        return text

    def extract_date_from_description(self, description: str) -> Optional[str]:
        """Extract date information from event description."""
        # Look for common date patterns
        date_patterns = [
            r'(\w+ \d{1,2},? \d{4})',  # "June 21, 2025"
            r'(\d{1,2}/\d{1,2}/\d{4})',  # "6/21/2025"
            r'(\w+ \d{1,2}, \d{4})',  # "June 21, 2025"
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, description)
            if match:
                date_str = match.group(1)
                try:
                    # Try to parse the date
                    if '/' in date_str:
                        dt = datetime.strptime(date_str, "%m/%d/%Y")
                    else:
                        # Handle "June 21, 2025" format
                        dt = datetime.strptime(date_str, "%B %d, %Y")
                    return dt.isoformat()
                except ValueError:
                    continue
        
        return None

    def extract_time_from_description(self, description: str) -> Optional[str]:
        """Extract time information from event description."""
        time_patterns = [
            r'(\d{1,2}:\d{2}\s*[AP]M)',  # "6:00 PM"
            r'(\d{1,2}:\d{2}\s*[AP]M\s*ET)',  # "6:00 PM ET"
            r'(\d{1,2}:\d{2}\s*[AP]M\s*-\s*\d{1,2}:\d{2}\s*[AP]M)',  # "6:00 PM - 7:00 PM"
        ]
        
        for pattern in time_patterns:
            match = re.search(pattern, description)
            if match:
                return match.group(1)
        
        return None

    def extract_cle_credits(self, description: str) -> Optional[float]:
        """Extract CLE credits from event description."""
        cle_patterns = [
            r'(\d+(?:\.\d+)?)\s+CLE\s+CREDITS?',
            r'CLE\s+CREDITS?:\s*(\d+(?:\.\d+)?)',
            r'(\d+(?:\.\d+)?)\s+CREDITS?',
        ]
        
        for pattern in cle_patterns:
            match = re.search(pattern, description, re.IGNORECASE)
            if match:
                try:
                    return float(match.group(1))
                except ValueError:
                    continue
        
        return None

    def determine_event_type(self, title: str, description: str) -> str:
        """Determine the event type based on title and description."""
        text_to_check = f"{title} {description}".lower()
        
        if 'cle' in text_to_check:
            return 'CLE'
        elif 'networking' in text_to_check:
            return 'Networking'
        elif 'annual dinner' in text_to_check or 'dinner' in text_to_check:
            return 'Annual Dinner'
        elif 'pro bono' in text_to_check or 'clinic' in text_to_check:
            return 'Pro Bono'
        elif 'board meeting' in text_to_check:
            return 'Board Meeting'
        elif 'committee' in text_to_check and 'meeting' in text_to_check:
            return 'Committee Meeting'
        elif 'reception' in text_to_check:
            return 'Reception'
        elif 'gala' in text_to_check:
            return 'Gala'
        elif 'wellness' in text_to_check:
            return 'Wellness'
        elif 'screening' in text_to_check:
            return 'Screening'
        elif 'mentor' in text_to_check:
            return 'Mentorship'
        else:
            return 'Event'

    def extract_price_info(self, description: str) -> Optional[dict]:
        """Extract pricing information from description."""
        price_info = {}
        
        # Look for free events
        if 'free' in description.lower() or 'no cost' in description.lower():
            price_info['cost'] = 'Free'
        
        # Look for specific prices
        price_patterns = [
            r'\$(\d+)',
            r'(\d+)\s*dollars?',
        ]
        
        for pattern in price_patterns:
            matches = re.findall(pattern, description)
            if matches:
                try:
                    price_info['cost'] = f"${matches[0]}"
                    break
                except (ValueError, IndexError):
                    continue
        
        return price_info if price_info else None

    def get_events(self) -> List[Event]:
        events = []
        try:
            response = self.session.get(self.rss_url)
            response.raise_for_status()
            
            # Parse RSS XML
            root = ET.fromstring(response.content)
            
            # Define namespace for RSS
            namespace = {'rss': 'http://www.w3.org/2005/Atom'}
            
            # Find all item elements (RSS items are direct children, not in namespace)
            items = root.findall('.//item')
            logger.info(f"Found {len(items)} events in RSS feed")
            
            for item in items:
                try:
                    # Extract basic event information
                    title_elem = item.find('title')
                    link_elem = item.find('link')
                    description_elem = item.find('description')
                    pub_date_elem = item.find('pubDate')
                    guid_elem = item.find('guid')
                    
                    logger.debug(f"Title elem: {title_elem}, Link elem: {link_elem}")
                    
                    if title_elem is None or link_elem is None:
                        logger.warning(f"Skipping item - missing title or link")
                        continue
                    
                    title = title_elem.text
                    link = link_elem.text
                    description_html = description_elem.text if description_elem is not None else ""
                    pub_date = pub_date_elem.text if pub_date_elem is not None else ""
                    guid = guid_elem.text if guid_elem is not None else ""
                    
                    logger.info(f"Processing event: {title}")
                    logger.debug(f"Link: {link}, Pub date: {pub_date}")
                    
                    # Clean description
                    description = self.clean_html(description_html)
                    
                    # Parse publication date
                    start_date = None
                    try:
                        if pub_date:
                            # Parse RSS date format: "Sat, 21 Jun 2025 13:00:00 GMT"
                            dt = datetime.strptime(pub_date, "%a, %d %b %Y %H:%M:%S GMT")
                            start_date = dt.isoformat()
                    except ValueError:
                        logger.warning(f"Could not parse date: {pub_date}")
                    
                    # Extract additional date/time from description
                    if not start_date:
                        start_date = self.extract_date_from_description(description)
                    
                    # Extract CLE credits
                    cle_credits = self.extract_cle_credits(description)
                    
                    # Determine event type
                    event_type = self.determine_event_type(title, description)
                    
                    # Extract pricing information
                    price_info = self.extract_price_info(description)
                    
                    # Create event ID
                    event_id = guid if guid else f"aabany_{hash(title)}"
                    
                    # Build metadata
                    metadata = {
                        "source_url": self.rss_url,
                        "event_link": link,
                        "rss_guid": guid,
                        "price_info": price_info,
                        "time_info": self.extract_time_from_description(description)
                    }
                    
                    # Use centralized categorization
                    base_categories = ['Bar Association', 'Legal Events', 'Asian American']
                    categories = EventCategorizer.categorize_event(title, description, base_categories)
                    
                    event = Event(
                        id=event_id,
                        name=title,
                        description=description,
                        startDate=start_date or "",
                        endDate=None,
                        locationId=None,
                        communityId="com_aabany",
                        image=None,
                        price=price_info,
                        metadata=metadata,
                        category=categories,
                        tags=None,
                        event_type=event_type,
                        cle_credits=cle_credits
                    )
                    
                    events.append(event)
                    logger.info(f"Successfully created event: {title} (Type: {event_type}, CLE: {cle_credits})")
                    
                except Exception as e:
                    logger.error(f"Error processing RSS item: {e}")
                    continue
            
            logger.info(f"Scraped {len(events)} events from AABANY RSS feed")
            
        except Exception as e:
            logger.error(f"Error fetching AABANY RSS feed: {e}")
        
        return events

if __name__ == "__main__":
    # Enable debug logging
    logging.basicConfig(level=logging.DEBUG)
    
    scraper = AABANYRSSScraper()
    events = scraper.run()
    print(f"Scraped {len(events)} events from AABANY RSS feed")
    print(f"Events saved to scrapers/data/") 