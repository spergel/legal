from dataclasses import dataclass
from typing import Optional, List, Dict, Any
from datetime import datetime

# NOTE: Event objects are used by all scrapers. Output location is handled by the scraper or base class.

@dataclass
class Event:
    id: str
    name: str
    description: Optional[str] = None
    startDate: str = ""  # ISO format
    endDate: Optional[str] = None  # ISO format
    locationId: Optional[str] = None
    communityId: Optional[str] = None
    image: Optional[str] = None
    price: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    category: Optional[List[str]] = None
    tags: Optional[List[str]] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert the event to a dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "startDate": self.startDate,
            "endDate": self.endDate,
            "locationId": self.locationId,
            "communityId": self.communityId,
            "image": self.image,
            "price": self.price,
            "metadata": self.metadata,
            "category": self.category,
            "tags": self.tags
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Event':
        """Create an event from a dictionary."""
        return cls(**data)

    @classmethod
    def from_raw_event(cls, raw_event: dict, community_id: str) -> 'Event':
        """Convert a raw event from any scraper to the standardized format."""
        # This will be implemented by each scraper
        raise NotImplementedError("Each scraper must implement this method") 