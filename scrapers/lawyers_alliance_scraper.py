import json
import logging
from datetime import datetime, timedelta
from typing import List, Optional
import requests
from bs4 import BeautifulSoup
import os
import time
import re
import hashlib
try:
    from .base_scraper import BaseScraper
    from .models import Event
    from .categorization_helper import EventCategorizer
except ImportError:
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from base_scraper import BaseScraper
    from models import Event
    from categorization_helper import EventCategorizer
from dotenv import load_dotenv
import feedparser

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
load_dotenv(os.path.join(PROJECT_ROOT, '.env.local'))

class LawyersAllianceScraper(BaseScraper):
    """Scraper for Lawyers Alliance events."""
    
    def __init__(self, community_id: str):
        super().__init__(community_id)
        self.url = "https://www.lawyersalliance.org/cle-events"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.google.com/',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'cross-site',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
        }
    
    def get_events(self) -> List[Event]:
        """Get events from the Lawyers Alliance website."""
        events = []
        try:
            response = requests.get(self.url, headers=self.headers)
            response.raise_for_status()

            # For debugging, save the HTML content
            with open("lawyers_alliance_debug.html", "w", encoding="utf-8") as f:
                f.write(response.text)

            soup = BeautifulSoup(response.content, 'html.parser')

            # Try multiple possible event selectors
            event_selectors = [
                'article.event-item',  # Original selector
                'div.event-item',      # Alternative
                'div.product-item',    # Might be used for CLE events
                'div.item',            # Generic item
                'tr',                  # Table rows
                'div.event',           # Simple event class
            ]
            
            items_found = []
            for selector in event_selectors:
                items = soup.select(selector)
                if items:
                    items_found = items
                    logger.info(f"Found {len(items)} items with selector: {selector}")
                    break
            
            if not items_found:
                logger.warning("No event items found with any selector")
                # Let's try to find anything that looks like an event
                potential_events = soup.find_all(text=re.compile(r'(workshop|webinar|training|seminar|CLE|event)', re.I))
                logger.info(f"Found {len(potential_events)} potential event text matches")
                
            for item in items_found:
                try:
                    # Try multiple title selectors
                    title_tag = None
                    for title_selector in ['h1.item-title a', 'h2 a', 'h3 a', 'a', 'h1', 'h2', 'h3']:
                        title_tag = item.select_one(title_selector)
                        if title_tag:
                            break
                    
                    if not title_tag:
                        continue
                    
                    name = title_tag.get_text(strip=True)
                    if not name:
                        continue
                        
                    # Get URL
                    if title_tag.name == 'a' and title_tag.get('href'):
                        href = title_tag['href']
                        if href.startswith('/'):
                            url = "https://www.lawyersalliance.org" + href
                        elif href.startswith('http'):
                            url = href
                        else:
                            url = "https://www.lawyersalliance.org/" + href
                    else:
                        url = "https://www.lawyersalliance.org/cle-events"

                    # Try multiple date selectors
                    date_tag = None
                    for date_selector in ['p.item-date', '.date', '.event-date', 'time']:
                        date_tag = item.select_one(date_selector)
                        if date_tag:
                            break
                    
                    if date_tag:
                        date_str = date_tag.get_text(strip=True)
                        start_datetime_obj = self.parse_date(date_str)
                    else:
                        # Use current date as fallback
                        start_datetime_obj = datetime.now()
                    
                    if not start_datetime_obj:
                        start_datetime_obj = datetime.now()

                    # Try multiple description selectors
                    description_tag = None
                    for desc_selector in ['div.item-content', '.description', '.content', 'p']:
                        description_tag = item.select_one(desc_selector)
                        if description_tag:
                            break
                    
                    description = description_tag.get_text(strip=True) if description_tag else "No description available."

                    event_id = f"lawyersalliance-{hashlib.sha256(url.encode('utf-8')).hexdigest()[:10]}"

                    event = Event(
                        id=event_id,
                        name=name,
                        description=description,
                        startDate=start_datetime_obj.isoformat(),
                        url=url,
                        communityId=self.community_id,
                    )
                    events.append(event)
                except Exception as e:
                    logger.error(f"Error parsing Lawyers Alliance event item: {e}")
                    continue

        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching page: {e}")
        except Exception as e:
            logger.error(f"An error occurred during parsing: {e}")

        return events

    def parse_date(self, date_str: str) -> Optional[datetime]:
        try:
            # Format is like: Wednesday, July 10, 2024 from 10:00 AM to 11:00 AM
            date_part = re.search(r'\w+,\s\w+\s\d+,\s\d{4}', date_str).group(0)
            time_parts = re.findall(r'\d{1,2}:\d{2}\s[AP]M', date_str)
            
            if not time_parts:
                return datetime.strptime(date_part, '%A, %B %d, %Y')

            start_time_str = time_parts[0]
            start_datetime_str = f"{date_part} {start_time_str}"
            
            return datetime.strptime(start_datetime_str, '%A, %B %d, %Y %I:%M %p')
        except (AttributeError, ValueError) as e:
            logger.error(f"Could not parse date: {date_str} due to {e}")
            return None

def main():
    """Main function to run the scraper."""
    scraper = LawyersAllianceScraper(community_id='com_lawyers_alliance')
    events = scraper.get_events()
    print(f"Scraped {len(events)} events")
    
    # Print events for testing
    for event in events:
        print(event.to_dict())

if __name__ == "__main__":
    main() 