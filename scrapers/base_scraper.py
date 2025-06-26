import logging
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import requests
import json
import os
from datetime import datetime, timezone
from .models import Event
from dotenv import load_dotenv
import time
from .categorization_helper import EventCategorizer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
load_dotenv(os.path.join(PROJECT_ROOT, '.env.local'))

class ScraperException(Exception):
    """Custom exception for scraper-related errors."""
    pass

class BaseScraper(ABC):
    """Base class for all scrapers."""
    
    def __init__(self, community_id: Optional[str] = None):
        self.community_id = community_id
        # Always save to scrapers/data relative to project root
        self.data_dir = os.path.join(PROJECT_ROOT, "scrapers", "data")
        os.makedirs(self.data_dir, exist_ok=True)
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1.1 Safari/605.1.15',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        })

    @abstractmethod
    def get_events(self) -> List[Event]:
        """Get events from the source. Must be implemented by each scraper."""
        raise NotImplementedError("Each scraper must implement this method")

    def save_events(self, events: List[Event], filename: str) -> None:
        """Save events to a JSON file."""
        filepath = os.path.join(self.data_dir, filename)
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump([event.to_dict() for event in events], f, indent=2)

    def run(self) -> List[Event]:
        """Run the scraper and return the events."""
        events = self.get_events()
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        filename = f"{self.community_id}_events_{timestamp}.json"
        self.save_events(events, filename)
        return events 