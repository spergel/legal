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
        """Convert the event to a dictionary compatible with Prisma schema."""
        def safe_str(value: Any) -> Optional[str]:
            """Safely convert value to string, handling None and objects."""
            if value is None:
                return None
            if isinstance(value, str):
                return value[:10000]  # Limit string length
            return str(value)[:10000]
        
        def safe_list(value: Any) -> List[str]:
            """Safely convert value to list of strings."""
            if value is None:
                return []
            if isinstance(value, list):
                return [str(item)[:1000] for item in value if item is not None]
            if isinstance(value, str):
                return [value[:1000]]
            return [str(value)[:1000]]
        
        def safe_dict(value: Any) -> Optional[Dict[str, Any]]:
            """Safely handle dictionary values."""
            if value is None:
                return None
            if isinstance(value, dict):
                return {str(k)[:100]: v for k, v in value.items() if k is not None}
            return None
        
        return {
            "externalId": safe_str(self.id),  # Use externalId for API compatibility
            "name": safe_str(self.name) or "Untitled Event",
            "description": safe_str(self.description) or "",
            "startDate": safe_str(self.startDate),
            "endDate": safe_str(self.endDate) or safe_str(self.startDate),  # Use startDate as endDate if no endDate provided
            "locationName": safe_str(self.locationName) or "TBD",  # Required field
            "url": safe_str(self.url),
            # Note: locationId and communityId are handled as relations in Prisma, not direct fields
            "image": safe_str(self.image),
            "price": safe_dict(self.price),
            "metadata": safe_dict(self.metadata),
            "category": safe_list(self.category),  # Will be converted to comma-separated string in API
            "tags": safe_list(self.tags),  # Will be converted to comma-separated string in API
            "eventType": safe_str(self.event_type),  # Note: Prisma uses camelCase
            "cleCredits": self.cle_credits if isinstance(self.cle_credits, (int, float)) else None  # Note: Prisma uses camelCase
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