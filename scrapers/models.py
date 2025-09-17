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
    endDate: str = ""  # ISO format - will be converted to DateTime in Prisma, required field
    locationName: str = "TBD"  # Required field in Prisma, default to "TBD"
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
        """Convert the event to a dictionary compatible with simplified Prisma schema."""
        def safe_str(value: Any) -> str:
            """Safely convert value to string, handling None and objects."""
            if value is None:
                return ""
            if isinstance(value, str):
                # Remove null characters and limit length
                clean_str = value.replace('\0', '').replace('\n', ' ').replace('\r', ' ')
                return clean_str[:1000]
            return str(value)[:1000]
        
        return {
            "externalId": safe_str(self.id),
            "name": safe_str(self.name) or "Untitled Event",
            "description": safe_str(self.description),
            "startDate": safe_str(self.startDate),
            "endDate": safe_str(self.endDate) or safe_str(self.startDate),
            "locationName": safe_str(self.locationName) or "TBD",
            "url": safe_str(self.url) if self.url else None,
            "cleCredits": self.cle_credits if isinstance(self.cle_credits, (int, float)) else None
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