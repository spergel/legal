"""
Academic Event Filter Utility

This module provides filtering logic to exclude internal academic events
from law school scrapers, ensuring only public events are included.
"""

import re
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class AcademicEventFilter:
    """Filter for excluding internal academic events from law school scrapers."""
    
    def __init__(self):
        # Keywords that indicate internal academic events (should be filtered out)
        self.internal_keywords = [
            # Academic calendar events
            'class schedule', 'class schedules', 'classes begin', 'classes end',
            'class start', 'class stop', 'class registration', 'class enrollment',
            
            # Administrative deadlines
            'deadline', 'due date', 'due', 'grades due', 'papers due',
            'forms due', 'submission deadline', 'registration deadline',
            'application deadline', 'payment deadline', 'fee deadline',
            
            # Academic requirements
            'independent study', 'writing requirement', 'exam conflict',
            'final examination', 'final exam', 'examinations', 'midterm',
            'quiz', 'assignment', 'homework', 'project due',
            
            # Internal prefixes (common in academic calendars)
            'law:', 'law :', 'law-', 'law -', 'academic:', 'academic :',
            'student:', 'student :', 'faculty:', 'faculty :',
            
            # Academic terms
            'fall semester', 'spring semester', 'summer session',
            'academic year', 'semester', 'quarter', 'trimester',
            'winter break', 'spring break', 'summer break',
            
            # Student-only events
            'student orientation', 'student meeting', 'student deadline',
            'student registration', 'student advising', 'student services',
            'faculty meeting', 'staff meeting', 'department meeting',
            'committee meeting', 'board meeting', 'senate meeting',
            
            # Administrative
            'no classes', 'holiday', 'break', 'recess', 'closed',
            'administrative', 'internal', 'faculty only', 'staff only',
            'student only', 'by invitation only', 'private',
            
            # Academic processes
            'add/drop period', 'withdrawal deadline', 'grade submission',
            'course evaluation', 'advising period', 'registration period',
            'enrollment period', 'billing period', 'financial aid deadline',
            'course registration'  # Added this to fix the failing test
        ]
        
        # Keywords that indicate public events (should be kept)
        self.public_keywords = [
            'lecture', 'symposium', 'conference', 'workshop', 'seminar',
            'panel', 'discussion', 'reception', 'celebration', 'ceremony',
            'award', 'presentation', 'talk', 'guest speaker', 'visiting',
            'public', 'community', 'alumni', 'networking', 'cle',
            'continuing legal education', 'professional development',
            'career fair', 'job fair', 'recruitment', 'open house',
            'information session', 'admissions', 'prospective students',
            'public interest', 'pro bono', 'clinics', 'externships'
        ]
        
        # Specific patterns that indicate internal events
        self.internal_patterns = [
            r'^law:\s*',  # Starts with "LAW: "
            r'^academic:\s*',  # Starts with "ACADEMIC: "
            r'^student:\s*',  # Starts with "STUDENT: "
            r'^faculty:\s*',  # Starts with "FACULTY: "
            r'\b(class|classes)\b.*\b(schedule|begin|end|start|stop)\b',  # Class schedules
            r'\b(deadline|due)\b.*\b(paper|grade|form|submission)\b',  # Deadlines
            r'\b(exam|examination|final)\b.*\b(monday|tuesday|wednesday|thursday|friday)\b',  # Exam schedules
            r'\b(no\s+classes|holiday|break|recess)\b',  # Closures
            r'\b(faculty|staff|student)\s+(meeting|deadline|only)\b',  # Internal meetings
            r'\b(add|drop|withdrawal)\s+(deadline|period)\b',  # Registration periods
            r'\b(registration|enrollment)\s+(deadline|period)\b',  # Registration periods
            r'\b(advising|advice)\s+(period|deadline)\b',  # Advising periods
            r'\b(billing|financial|payment)\s+(deadline|period)\b',  # Financial deadlines
            r'\b(grade|grades)\s+(due|submission|deadline)\b',  # Grade deadlines
            r'\b(independent\s+study|writing\s+requirement)\b',  # Academic requirements
            r'\b(course|courses)\s+(begin|end|start|stop)\b'  # Course schedules
        ]
    
    def is_internal_academic_event(self, title: str, description: Optional[str] = None) -> bool:
        """
        Determine if an event is an internal academic event that should be filtered out.
        
        Args:
            title: Event title
            description: Event description (optional)
            
        Returns:
            True if event should be filtered out, False if it should be kept
        """
        if not title or not title.strip():
            return True
            
        # Convert to lowercase for case-insensitive matching
        title_lower = title.lower().strip()
        desc_lower = (description or "").lower().strip()
        
        # Check for internal academic indicators
        for keyword in self.internal_keywords:
            if keyword.lower() in title_lower or keyword.lower() in desc_lower:
                logger.info(f"Filtering out internal academic event: '{title}' (keyword: '{keyword}')")
                return True
        
        # Check if title starts with internal prefixes
        if title_lower.startswith(('law:', 'law :', 'law-', 'law -', 'academic:', 'academic :', 'student:', 'student :', 'faculty:', 'faculty :')):
            logger.info(f"Filtering out internal academic event: '{title}' (internal prefix)")
            return True
        
        # Check for specific patterns that indicate internal events
        for pattern in self.internal_patterns:
            if re.search(pattern, title_lower):
                logger.info(f"Filtering out internal academic event: '{title}' (pattern: '{pattern}')")
                return True
        
        # Check if it's likely a public event
        public_indicator_count = 0
        for keyword in self.public_keywords:
            if keyword.lower() in title_lower or keyword.lower() in desc_lower:
                public_indicator_count += 1
        
        # If we have multiple public indicators, it's likely a public event
        if public_indicator_count >= 2:
            return False
        
        # If title is very short or generic, it might be internal
        if len(title.strip()) < 10:
            logger.info(f"Filtering out short/generic event: '{title}'")
            return True
        
        # Default: keep the event (be conservative)
        return False
    
    def filter_events(self, events: list, title_field: str = 'name', description_field: str = 'description') -> list:
        """
        Filter a list of events to exclude internal academic events.
        
        Args:
            events: List of event dictionaries
            title_field: Field name containing the event title
            description_field: Field name containing the event description
            
        Returns:
            Filtered list of events
        """
        if not events:
            return events
            
        original_count = len(events)
        filtered_events = []
        
        for event in events:
            title = event.get(title_field, '')
            description = event.get(description_field, '')
            
            if not self.is_internal_academic_event(title, description):
                filtered_events.append(event)
        
        filtered_count = len(filtered_events)
        logger.info(f"Filtered {original_count} events to {filtered_count} public events")
        
        return filtered_events

# Global instance for easy import
academic_filter = AcademicEventFilter()
