import logging
import re
from datetime import datetime
from typing import List, Optional

import feedparser
from bs4 import BeautifulSoup
import requests
import xml.etree.ElementTree as ET

from .base_scraper import BaseScraper
from .models import Event
from .categorization_helper import EventCategorizer
import json

logger = logging.getLogger(__name__)

class AabanyRssScraper(BaseScraper):
    """
    Scraper for AABANY events from their RSS feed.
    """
    def __init__(self, community_id="com_aabany"):
        super().__init__(community_id)
        self.url = "https://www.aabany.org/resource/rss/events.rss"

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
        # Look for common date patterns with more comprehensive matching
        date_patterns = [
            # "June 21, 2025" or "June 21 2025"
            (r'(\w+ \d{1,2},? \d{4})', ["%B %d, %Y", "%B %d %Y"]),
            # "Jun 21, 2025" (abbreviated month)
            (r'(\w{3} \d{1,2},? \d{4})', ["%b %d, %Y", "%b %d %Y"]),
            # "6/21/2025" or "06/21/2025"
            (r'(\d{1,2}/\d{1,2}/\d{4})', ["%m/%d/%Y"]),
            # "2025-06-21" (ISO format)
            (r'(\d{4}-\d{1,2}-\d{1,2})', ["%Y-%m-%d"]),
            # "Friday June 27" - need to add current year
            (r'(\w+day \w+ \d{1,2})', ["%A %B %d"]),
            # "June 27 - June 28" (date ranges - take first date)
            (r'(\w+ \d{1,2})\s*-\s*\w+ \d{1,2}', ["%B %d"]),
        ]
        
        for pattern, formats in date_patterns:
            match = re.search(pattern, description, re.IGNORECASE)
            if match:
                date_str = match.group(1)
                for date_format in formats:
                    try:
                        # Parse the date
                        dt = datetime.strptime(date_str, date_format)
                        
                        # If only month/day (no year), assume current or next year
                        if "%Y" not in date_format:
                            current_year = datetime.now().year
                            dt = dt.replace(year=current_year)
                            # If the date is in the past, assume next year
                            if dt < datetime.now():
                                dt = dt.replace(year=current_year + 1)
                        
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
            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
            response = requests.get(self.url, headers=headers)
            response.raise_for_status()
            
            # Parse RSS XML
            root = ET.fromstring(response.content)
            
            for item in root.findall('.//item'):
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
                    
                    # Skip events without valid dates to prevent database errors
                    if not start_date:
                        logger.warning(f"Skipping event '{title}' - no valid date found in pub_date '{pub_date}' or description")
                        continue
                    
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
                        "source_url": self.url,
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
                        startDate=start_date,
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

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    scraper = AabanyRssScraper()
    events = scraper.get_events()
    print(json.dumps([event.to_dict() for event in events], indent=2)) 