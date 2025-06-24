import requests
import logging
from typing import List
from bs4 import BeautifulSoup
from datetime import datetime
from scrapers.base_scraper import BaseScraper
from scrapers.models import Event
import json
import base64
import re

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class NAWLScraper(BaseScraper):
    """
    Scraper for National Association of Women Lawyers (NAWL) events.
    This scraper pulls events from a JSON object embedded in the page's HTML.
    """
    def __init__(self, community_id="com_nawl"):
        super().__init__(community_id)
        self.url = "https://www.nawl.org/events"

    def get_events(self) -> List[Event]:
        events = []
        try:
            response = self.session.get(self.url)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')

            widget_div = soup.find('div', id='1399355783')
            if not widget_div:
                logger.warning("Could not find the event widget div.")
                return []

            widget_config_str = widget_div.get('data-widget-config')
            if not widget_config_str:
                logger.warning("Could not find data-widget-config in the event widget div.")
                return []

            try:
                # The config is Base64 encoded JSON
                decoded_config_str = base64.b64decode(widget_config_str).decode('utf-8')
                widget_config = json.loads(decoded_config_str)
            except (json.JSONDecodeError, base64.binascii.Error) as e:
                logger.error(f"Failed to decode widget config: {e}")
                logger.debug(f"Widget config string was: {widget_config_str}")
                return []

            event_list = widget_config.get("neon-event-list", [])

            logger.info(f"Found {len(event_list)} events in the widget config.")

            for item in event_list:
                try:
                    event_name = item.get('event-name')
                    start_date_str = item.get('start-date')
                    event_url = item.get('event-link')
                    
                    if not all([event_name, start_date_str, event_url]):
                        logger.warning(f"Skipping event with missing data: {item}")
                        continue

                    start_date = datetime.strptime(start_date_str, '%b %d %Y %H:%M')
                    
                    # Create a unique ID for the event
                    event_id_match = re.search(r'event=(\d+)', event_url)
                    if event_id_match:
                        event_id = f"nawl_{event_id_match.group(1)}"
                    else:
                        # Fallback to using a hash of the URL if the ID is not found
                        event_id = f"nawl_{hash(event_url)}"

                    # Description and other details are not available in this JSON
                    description = "Details available on the event page."

                    event = Event(
                        id=event_id,
                        name=event_name,
                        startDate=start_date.isoformat(),
                        communityId=self.community_id,
                        url=event_url,
                        description=description,
                        event_type="Unknown",
                        cle_credits="Unknown",
                    )
                    events.append(event)
                except (ValueError, TypeError) as e:
                    logger.error(f"Error parsing event item: {item}. Error: {e}")

        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching NAWL events page: {e}")
        except Exception as e:
            logger.error(f"An unexpected error occurred in NAWL scraper: {e}", exc_info=True)
            
        return events

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    scraper = NAWLScraper()
    events = scraper.get_events()
    print(f"Found {len(events)} events for NAWL.")
    for event in events:
        print(json.dumps(event.to_dict(), indent=2)) 