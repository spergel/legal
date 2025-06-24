import re
from datetime import datetime
import hashlib
import json

import requests
from bs4 import BeautifulSoup

from .base_scraper import BaseScraper
from .models import Event


class ACCScraper(BaseScraper):
    def __init__(self, community_id="com_acc_nyc"):
        super().__init__(community_id)
        self.url = "https://www.acc.com/education-events?field_delivery_type_value=2&chapter=New%20York%20City"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
            'Accept-Language': 'en-US,en;q=0.9',
        }

    def get_events(self):
        events = []
        response = requests.get(self.url, headers=self.headers)
        if response.status_code != 200:
            print(f"Failed to retrieve ACC events page: {response.status_code}")
            return events

        soup = BeautifulSoup(response.content, 'html.parser')
        
        next_data_script = soup.find('script', id='__NEXT_DATA__')
        if not next_data_script:
            print("Could not find __NEXT_DATA__ script tag.")
            return events

        try:
            next_data = json.loads(next_data_script.string)
            event_items = next_data.get('props', {}).get('pageProps', {}).get('eventResults', {}).get('items', [])

            for item in event_items:
                try:
                    name = item.get('title')
                    start_date_str = item.get('field_start_date_time')
                    end_date_str = item.get('field_end_date_time')
                    
                    start_datetime_obj = datetime.fromisoformat(start_date_str.replace("Z", "+00:00"))
                    end_datetime_obj = datetime.fromisoformat(end_date_str.replace("Z", "+00:00"))

                    description = item.get('field_description_processed', "No description available.")
                    
                    registration_link = "https://www.acc.com" + item.get('path', {}).get('alias')
                    
                    location_str = item.get('field_event_location', "Unknown")

                    event_type = item.get('field_delivery_type')

                    hash_input = f"{name}-{start_datetime_obj}-{location_str}"
                    event_id = f"acc-{hashlib.sha256(hash_input.encode('utf-8')).hexdigest()[:10]}"

                    event = Event(
                        id=event_id,
                        name=name,
                        description=description,
                        startDate=start_datetime_obj.isoformat(),
                        endDate=end_datetime_obj.isoformat(),
                        url=registration_link,
                        communityId=self.community_id,
                        locationId=None,
                        metadata={
                            "location_string": location_str,
                        },
                        event_type=event_type,
                    )
                    events.append(event)
                except Exception as e:
                    print(f"Error parsing ACC event item: {e}")
                    continue
        except (json.JSONDecodeError, KeyError) as e:
            print(f"Error parsing __NEXT_DATA__ JSON: {e}")

        return events 