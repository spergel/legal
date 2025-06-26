#!/usr/bin/env python3
"""
Scraper for Queens County Bar Association events: https://members.qcba.org/qcba-events-and-education-calendar
"""

import logging
from typing import List
import requests
from bs4 import BeautifulSoup
import hashlib
from .base_scraper import BaseScraper
from .models import Event

logger = logging.getLogger(__name__)

class QCBAScraper(BaseScraper):
    """Scraper for Queens County Bar Association events."""
    
    def __init__(self, community_id: str = "com_qcba"):
        super().__init__(community_id)
        self.url = "https://members.qcba.org/qcba-events-and-education-calendar"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        }
    
    def get_events(self) -> List[Event]:
        """Fetch and parse events from the QCBA website."""
        logger.info(f"Fetching events from {self.url}")
        events = []
        
        try:
            response = requests.get(self.url, headers=self.headers)
            response.raise_for_status()

            with open("qcba_debug.html", "w", encoding="utf-8") as f:
                f.write(response.text)

            soup = BeautifulSoup(response.content, 'html.parser')
            
            logger.info("HTML content saved to qcba_debug.html for analysis.")

        except requests.RequestException as e:
            logger.error(f"Error fetching page {self.url}: {e}")
        
        return events

def main():
    """Main function to run the scraper for testing."""
    scraper = QCBAScraper()
    events = scraper.get_events()
    logger.info(f"Scraped {len(events)} events.")
    for event in events:
        print(event.to_dict())

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    main() 