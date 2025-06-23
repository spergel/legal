"""
Categorization helper for legal event scrapers.
Provides common functionality for tagging and categorizing events.
"""

from typing import List


class EventCategorizer:
    """Helper class for categorizing legal events with consistent tagging."""
    
    # Legal practice areas
    PRACTICE_AREAS = [
        'criminal law', 'civil rights', 'immigration', 'family law', 'corporate law',
        'environmental law', 'health law', 'tax law', 'real estate', 'intellectual property',
        'labor law', 'constitutional law', 'international law', 'bankruptcy', 'estate planning',
        'employment law', 'commercial law', 'litigation', 'arbitration', 'mediation',
        'securities law', 'antitrust', 'privacy law', 'cybersecurity', 'white collar crime',
        'elder law', 'disability law', 'education law', 'energy law', 'entertainment law',
        'government law', 'healthcare law', 'insurance law', 'maritime law', 'military law',
        'nonprofit law', 'patent law', 'personal injury', 'public interest', 'sports law',
        'trademark law', 'transportation law', 'veterans law', 'workers compensation'
    ]
    
    # CLE indicators
    CLE_INDICATORS = [
        'cle', 'continuing legal education', 'credit', 'ethics', 'professional responsibility',
        'mcje', 'new york', 'accredited', 'certification', 'credit hour', 'transitional',
        'professional development', 'mandatory cle', 'skills training'
    ]
    
    # Networking event indicators
    NETWORKING_INDICATORS = [
        'networking', 'reception', 'mixer', 'happy hour', 'social', 'dinner', 'lunch',
        'cocktail', 'meet and greet', 'annual dinner', 'gala', 'celebration', 'breakfast',
        'coffee', 'wine tasting', 'holiday party', 'awards ceremony', 'fundraiser'
    ]
    
    # Webinar indicators
    WEBINAR_INDICATORS = [
        'webinar', 'webcast', 'virtual event', 'online event', 'virtual seminar', 'online presentation'
    ]
    
    @classmethod
    def extract_practice_areas(cls, title: str, description: str = "") -> List[str]:
        """Extract practice areas from event title and description."""
        categories = []
        text = f"{title} {description or ''}".lower()
        
        for area in cls.PRACTICE_AREAS:
            if area in text:
                categories.append(area.title())
        
        return categories
    
    @classmethod
    def is_cle_event(cls, title: str, description: str = "") -> bool:
        """Determine if this is a CLE event."""
        text = f"{title} {description or ''}".lower()
        return any(indicator in text for indicator in cls.CLE_INDICATORS)
    
    @classmethod
    def is_networking_event(cls, title: str, description: str = "") -> bool:
        """Determine if this is a networking event."""
        text = f"{title} {description or ''}".lower()
        return any(indicator in text for indicator in cls.NETWORKING_INDICATORS)
    
    @classmethod
    def is_webinar(cls, title: str, description: str = "") -> bool:
        """Determine if this is a webinar."""
        text = f"{title} {description or ''}".lower()
        return any(indicator in text for indicator in cls.WEBINAR_INDICATORS)
    
    @classmethod
    def get_tags(cls, title: str, description: str = "") -> List[str]:
        """Extract relevant tags from event details."""
        tags = []
        if cls.is_cle_event(title, description):
            tags.append('CLE')
        if cls.is_networking_event(title, description):
            tags.append('Networking')
        if cls.is_webinar(title, description):
            tags.append('Webinar')
        # This can be expanded to extract more tags
        return tags
    
    @classmethod
    def get_event_type(cls, title: str, description: str = "") -> str:
        """Determine the primary type of the event."""
        if cls.is_cle_event(title, description):
            return 'CLE'
        if cls.is_webinar(title, description):
            return 'Webinar'
        if cls.is_networking_event(title, description):
            return 'Networking'
        # Can be expanded with more sophisticated logic
        return 'General'
    
    @classmethod
    def categorize_event(cls, title: str, description: str = "", 
                        base_categories: List[str] = None) -> List[str]:
        """
        Comprehensive event categorization.
        
        Args:
            title: Event title
            description: Event description
            base_categories: Base categories to start with (e.g., organization type)
            
        Returns:
            List of categories/tags for the event
        """
        categories = list(base_categories) if base_categories else []
        
        # Add practice areas
        practice_areas = cls.extract_practice_areas(title, description)
        categories.extend(practice_areas)
        
        # Add event type tags
        if cls.is_cle_event(title, description):
            categories.append('CLE')
        
        if cls.is_networking_event(title, description):
            categories.append('Networking')
        
        # Remove duplicates while preserving order
        return list(dict.fromkeys(categories))


# Convenience functions for backward compatibility
def extract_practice_areas(title: str, description: str = "") -> List[str]:
    """Extract practice areas from event title and description."""
    return EventCategorizer.extract_practice_areas(title, description)

def is_cle_event(title: str, description: str = "") -> bool:
    """Determine if this is a CLE event."""
    return EventCategorizer.is_cle_event(title, description)

def is_networking_event(title: str, description: str = "") -> bool:
    """Determine if this is a networking event."""
    return EventCategorizer.is_networking_event(title, description)

def is_webinar(title: str, description: str = "") -> bool:
    """Determine if this is a webinar."""
    return EventCategorizer.is_webinar(title, description)

def categorize_event(title: str, description: str = "", 
                    base_categories: List[str] = None) -> List[str]:
    """Comprehensive event categorization."""
    return EventCategorizer.categorize_event(title, description, base_categories)
