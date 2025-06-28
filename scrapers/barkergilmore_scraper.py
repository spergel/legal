import os
import requests
from bs4 import BeautifulSoup
from typing import List
from datetime import datetime
import hashlib
import sys
import re
import logging
import json

# Adjust path to import from parent directory
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '..'))
sys.path.append(PROJECT_ROOT)

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

logger = logging.getLogger(__name__)

class BarkerGilmoreScraper(BaseScraper):
    """Scraper for BarkerGilmore webinars."""
    def __init__(self, community_id: str = "com_barkergilmore"):
        super().__init__(community_id)
        self.base_url = "https://www.barkergilmore.com"
        self.webinars_url = f"{self.base_url}/content_type/webinar/"

    def get_events(self) -> List[Event]:
        events = []
        try:
            response = self.session.get(self.webinars_url, timeout=30)
            response.raise_for_status()

            with open("barkergilmore_debug.html", "w", encoding="utf-8") as f:
                f.write(response.text)

            soup = BeautifulSoup(response.text, 'html.parser')

            # Try multiple selectors for event containers
            selectors = [
                'div.fusion-posts-container article.post',
                'article.post',
                '.fusion-blog-layout',
                '.fusion-portfolio',
                'article',
                '.webinar-item',
                '.event-item'
            ]
            
            event_containers = []
            for selector in selectors:
                containers = soup.select(selector)
                if containers:
                    event_containers = containers
                    logger.info(f"Found {len(containers)} containers with selector: {selector}")
                    break
            
            if not event_containers:
                logger.info("No event containers found on BarkerGilmore website with any selector.")
                return events

            for container in event_containers:
                try:
                    # Try multiple title selectors
                    title_selectors = [
                        'h2.blog-shortcode-post-title a',
                        'h2 a',
                        'h3 a',
                        'a.fusion-post-title',
                        '.entry-title a',
                        'h2',
                        'h3',
                        '.title',
                    ]
                    
                    title_tag = None
                    for t_selector in title_selectors:
                        title_tag = container.select_one(t_selector)
                        if title_tag:
                            break
                    
                    if not title_tag:
                        continue
                    
                    name = title_tag.get_text(strip=True)
                    url = title_tag.get('href') if title_tag.name == 'a' else container.select_one('a')['href'] if container.select_one('a') else None
                    
                    if not url:
                        continue
                        
                    # Make URL absolute if needed
                    if not url.startswith('http'):
                        url = self.base_url + url if url.startswith('/') else self.base_url + '/' + url

                    date_str = None
                    meta_info_tag = container.select_one('p.fusion-single-line-meta')
                    if meta_info_tag:
                        meta_text = meta_info_tag.get_text(separator='|', strip=True)
                        parts = [p.strip() for p in meta_text.split('|')]
                        # The date is usually the second part.
                        if len(parts) > 1:
                            # Find the part that can be parsed as a date
                            for part in parts:
                                try:
                                    datetime.strptime(part, '%b %d, %Y')
                                    date_str = part
                                    break
                                except ValueError:
                                    continue

                    startDate = None
                    if date_str:
                        try:
                            # Parse date - don't skip past events, just note them
                            event_date = datetime.strptime(date_str, '%b %d, %Y')
                            startDate = event_date.isoformat()
                        except ValueError:
                            logger.warning(f"Could not parse date '{date_str}' for event: {name}")
                            # Use current date as fallback
                            startDate = datetime.now().isoformat()
                    else:
                        # Use current date as fallback if no date found
                        startDate = datetime.now().isoformat()

                    description_tag = container.select_one('div.fusion-post-content-container p')
                    short_description = description_tag.get_text(strip=True) if description_tag else ""
                    
                    full_description = self.get_event_description(url)

                    event_id = hashlib.md5(url.encode()).hexdigest()
                    
                    base_categories = ['Webinar', 'Legal', 'Professional Development']
                    categories = EventCategorizer.categorize_event(name, full_description, base_categories)
                    event_type = "Webinar"

                    event = Event(
                        id=f"barkergilmore_{event_id}",
                        name=name,
                        description=full_description,
                        communityId=self.community_id,
                        startDate=startDate,
                        endDate=startDate, 
                        url=url,
                        event_type=event_type,
                        category=categories,
                        metadata={'source': 'BarkerGilmore Webinars', 'short_description': short_description}
                    )
                    events.append(event)
                except Exception as e:
                    logger.error(f"Error parsing event container for {url}: {e}")
                    continue
        except Exception as e:
            logger.error(f"Error fetching or parsing BarkerGilmore webinars page: {e}")

        logger.info(f"Found {len(events)} events for BarkerGilmore.")
        return events

    def get_event_description(self, event_url: str) -> str:
        """Fetches the event's page and extracts the full description."""
        try:
            response = self.session.get(event_url, timeout=30)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            content_area = soup.select_one('div.post-content')
            if content_area:
                return content_area.get_text(separator=' ', strip=True)
            return ""
        except Exception as e:
            logger.error(f"Failed to fetch description from {event_url}: {e}")
            return ""

def main():
    """Main function to run the scraper for testing purposes."""
    logging.basicConfig(level=logging.INFO)
    scraper = BarkerGilmoreScraper()
    events = scraper.get_events()
    if events:
        for event in events:
            print(json.dumps(event.to_dict(), indent=2))
    else:
        print("No events found.")

if __name__ == "__main__":
    main() 