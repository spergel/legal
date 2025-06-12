import json
import logging
from datetime import datetime, timedelta
from typing import List, Optional
import requests
from bs4 import BeautifulSoup
import os
import time
import re
from base_scraper import BaseScraper
from models import Event
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
    """Scraper for Lawyers Alliance events via RSS feed."""
    
    def __init__(self, community_id: str):
        super().__init__(community_id)
        self.rss_url = "https://go.activecalendar.com/FordhamUniversity/site/law/page/rss/?duration=180days"
    
    def get_events(self) -> List[Event]:
        """Get events from the Lawyers Alliance website."""
        events = []
        feed = feedparser.parse(self.rss_url)
        for entry in feed.entries:
            try:
                title = entry.title
                link = entry.link
                description = getattr(entry, 'summary', None)
                start_date = getattr(entry, 'published', None) or getattr(entry, 'updated', None)
                event = Event(
                    id=f"lawyers_alliance_{hash(link)}",
                    name=title,
                    description=description,
                    startDate=start_date,
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
                print(f"Error processing Lawyers Alliance event: {e}")
                continue
        return events

def main():
    """Main function to run the scraper."""
    scraper = LawyersAllianceScraper(community_id='com_lawyers_alliance')
    events = scraper.run()
    print(f"Scraped {len(events)} events")
    
    # Print events for testing
    for event in events:
        print("\n" + "="*80)
        print(f"Event: {event.title}")
        print(f"Date: {event.date}")
        print(f"Time: {event.time}")
        print(f"Location: {event.location_name}")
        if event.description:
            print(f"Description: {event.description[:200]}...")  # Print first 200 chars
        if event.presenters:
            print(f"Presenters: {', '.join(event.presenters)}")
        if event.learning_objectives:
            print(f"Learning Objectives: {event.learning_objectives}")
        if event.target_audience:
            print(f"Target Audience: {event.target_audience}")
        if event.topics:
            print(f"Topics: {', '.join(event.topics)}")
        print(f"Registration URL: {event.registration_url}")
        print("="*80)
    
    # Save events to a JSON file
    data_dir = os.path.join(os.path.dirname(__file__), 'data')
    os.makedirs(data_dir, exist_ok=True)
    output_file = os.path.join(data_dir, 'lawyers_alliance_events.json')
    
    with open(output_file, 'w') as f:
        json.dump([event.dict() for event in events], f, indent=2, default=str)
    
    print(f"\nEvents saved to {output_file}")

if __name__ == "__main__":
    main() 