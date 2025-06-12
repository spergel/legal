import requests
from bs4 import BeautifulSoup
from datetime import datetime
import re
from typing import List, Optional
from base_scraper import BaseScraper
from models import Event
import os

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

class NYIACScraper(BaseScraper):
    """Scraper for NYIAC events."""
    
    def __init__(self, community_id: str):
        super().__init__(community_id)
        self.base_url = "https://www.nyiac.org"
        self.events_url = f"{self.base_url}/events"
    
    def get_events(self) -> List[Event]:
        """Get events from the NYIAC website."""
        response = self.session.get(self.events_url)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        events = []
        
        # Find all event containers
        event_containers = soup.find_all('div', class_='event-item')
        
        for container in event_containers:
            try:
                # Extract event details
                title_elem = container.find('h3', class_='event-title')
                if not title_elem:
                    continue
                
                title = title_elem.text.strip()
                link = title_elem.find('a')['href']
                if not link.startswith('http'):
                    link = f"{self.base_url}{link}"
                
                # Get event details page
                event_response = self.session.get(link)
                event_response.raise_for_status()
                event_soup = BeautifulSoup(event_response.text, 'html.parser')
                
                # Extract date and time
                date_elem = event_soup.find('div', class_='event-date')
                time_elem = event_soup.find('div', class_='event-time')
                
                if not date_elem or not time_elem:
                    continue
                
                date_str = date_elem.text.strip()
                time_str = time_elem.text.strip()
                
                # Parse date and time
                try:
                    date_obj = datetime.strptime(date_str, '%B %d, %Y')
                    time_obj = datetime.strptime(time_str, '%I:%M %p')
                    start_date = datetime.combine(date_obj.date(), time_obj.time())
                except ValueError:
                    continue
                
                # Extract description
                description_elem = event_soup.find('div', class_='event-description')
                description = description_elem.text.strip() if description_elem else None
                
                # Extract location
                location_elem = event_soup.find('div', class_='event-location')
                location = location_elem.text.strip() if location_elem else None
                
                # Extract price
                price_elem = event_soup.find('div', class_='event-price')
                price = None
                if price_elem:
                    price_text = price_elem.text.strip()
                    if 'free' in price_text.lower():
                        price = {"type": "free", "amount": 0, "currency": "USD"}
                    else:
                        # Try to extract price amount
                        match = re.search(r'\$(\d+)', price_text)
                        if match:
                            amount = int(match.group(1))
                            price = {"type": "paid", "amount": amount, "currency": "USD"}
                
                # Create event object
                event = Event(
                    id=f"nyiac_{start_date.strftime('%Y%m%d_%H%M')}",
                    name=title,
                    description=description,
                    startDate=start_date.isoformat(),
                    endDate=None,  # End time not provided
                    locationId=None,  # Location ID mapping needed
                    communityId=self.community_id,
                    image=None,  # Image URL not provided
                    price=price,
                    metadata={
                        "source_url": link,
                        "venue": {
                            "name": location,
                            "type": "in-person" if location else "virtual"
                        }
                    },
                    category=["Arbitration"],  # Default category
                    tags=None
                )
                
                events.append(event)
                
            except Exception as e:
                print(f"Error processing event: {e}")
                continue
        
        return events

def main():
    """Main function to run the scraper."""
    scraper = NYIACScraper(community_id='com_nyiac')
    events = scraper.run()
    print(f"Scraped {len(events)} events")

if __name__ == "__main__":
    main()
