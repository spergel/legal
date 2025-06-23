from dataclasses import dataclass
from typing import Optional, List, Dict, Any
from datetime import datetime

# NOTE: Event objects are used by all scrapers. Output location is handled by the scraper or base class.

@dataclass
class Event:
    id: str
    name: str
    description: Optional[str] = None
    startDate: str = ""  # ISO format - will be converted to DateTime in Prisma
    endDate: Optional[str] = None  # ISO format - will be converted to DateTime in Prisma
    url: Optional[str] = None
    locationId: Optional[str] = None
    communityId: Optional[str] = None
    image: Optional[str] = None
    price: Optional[Dict[str, Any]] = None  # Will be stored as Json in Prisma
    metadata: Optional[Dict[str, Any]] = None  # Will be stored as Json in Prisma
    category: Optional[List[str]] = None  # Will be stored as String[] in Prisma
    tags: Optional[List[str]] = None  # Will be stored as String[] in Prisma
    event_type: Optional[str] = None  # Will be stored as eventType in Prisma
    cle_credits: Optional[float] = None  # Will be stored as cleCredits Float in Prisma

    def to_dict(self) -> Dict[str, Any]:
        """Convert the event to a dictionary compatible with Prisma schema."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description or "",
            "startDate": self.startDate,
            "endDate": self.endDate,
            "url": self.url,
            "locationId": self.locationId,
            "communityId": self.communityId,
            "image": self.image,
            "price": self.price,
            "metadata": self.metadata,
            "category": self.category or [],
            "tags": self.tags or [],
            "eventType": self.event_type,  # Note: Prisma uses camelCase
            "cleCredits": self.cle_credits  # Note: Prisma uses camelCase
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Event':
        """Create an event from a dictionary."""
        # Handle Prisma camelCase field names
        if 'eventType' in data:
            data['event_type'] = data.pop('eventType')
        if 'cleCredits' in data:
            data['cle_credits'] = data.pop('cleCredits')
        return cls(**data)

    @classmethod
    def from_raw_event(cls, raw_event: dict, community_id: str) -> 'Event':
        """Convert a raw event from any scraper to the standardized format."""
        # This will be implemented by each scraper
        raise NotImplementedError("Each scraper must implement this method") 
    @classmethod
    def from_raw_event(cls, raw_event: dict, community_id: str) -> 'Event':
        """Convert a raw event from any scraper to the standardized format."""
        # This will be implemented by each scraper
        raise NotImplementedError("Each scraper must implement this method") 