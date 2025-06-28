import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import re
from urllib.parse import urljoin
try:
    from base_scraper import BaseScraper
except ImportError:
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from base_scraper import BaseScraper

class NyiplaScaper(BaseScraper):
    
    def get_events(self):
        events = []
        
        # NYIPLA events URL
        url = "https://www.nyipla.org/nyipla/events.asp"
        
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find the events table or list
            # Events appear to be in a table format with month headers and event listings
            
            # Look for event links and text content
            event_links = soup.find_all('a', href=re.compile(r'ev\.asp\?ID='))
            
            current_month = None
            current_year = datetime.now().year
            
            # Parse events from the structured list
            for link in event_links:
                try:
                    event_data = self.extract_event_from_link(link, url, current_month, current_year)
                    if event_data:
                        events.append(event_data)
                        print(f"Found event: {event_data['title']}")
                except Exception as e:
                    print(f"Error extracting event from link: {e}")
                    continue
            
            # Also try to extract from the text content in table format
            # Look for month headers and subsequent events
            event_table = soup.find('table') or soup.find('td')
            if event_table:
                text_content = event_table.get_text()
                events.extend(self.parse_events_from_text(text_content))
                    
        except Exception as e:
            print(f"Error fetching NYIPLA events: {e}")
            
        return events
    
    def extract_event_from_link(self, link, base_url, current_month, current_year):
        """Extract event data from an event link"""
        
        # Get the link URL
        event_url = urljoin(base_url, link['href'])
        
        # Get the title from the link text
        title = link.get_text(strip=True)
        if not title or len(title) < 3:
            return None
        
        # Try to find date information around the link
        parent = link.parent
        if parent:
            parent_text = parent.get_text()
            
            # Look for date patterns
            date_match = re.search(r'(\d{1,2})/(\d{1,2})/(\d{4})', parent_text)
            if date_match:
                month, day, year = date_match.groups()
                try:
                    start_date = datetime(int(year), int(month), int(day))
                except:
                    start_date = None
            else:
                # Try to infer from context or use current date as fallback
                start_date = None
        else:
            start_date = None
            
        # Extract any additional description from siblings or parent elements
        description = title
        
        # Try to get more details from the parent row or context
        if parent and parent.name in ['td', 'tr']:
            # Look for siblings that might contain time or description
            siblings = parent.find_next_siblings()
            for sibling in siblings[:2]:  # Check next couple elements
                sibling_text = sibling.get_text(strip=True)
                if sibling_text and sibling_text not in title:
                    description += f" - {sibling_text}"
        
        from models import Event
        import hashlib
        
        event_date = start_date.strftime('%Y-%m-%d') if start_date else datetime.now().strftime('%Y-%m-%d')
        # Generate a unique ID for the event
        event_id = hashlib.md5(f"nyipla_{title}_{event_date}".encode()).hexdigest()[:12]
        
        return Event(
            id=event_id,
            name=title,
            startDate=event_date,
            description=description,
            locationName="NYIPLA Event", 
            url=event_url
        )
    
    def parse_events_from_text(self, text_content):
        """Parse events from the text content of the events page"""
        events = []
        
        # Split by lines and look for event patterns
        lines = text_content.split('\n')
        current_month = None
        current_year = datetime.now().year
        
        for i, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue
                
            # Check if this line is a month header
            month_match = re.match(r'^(January|February|March|April|May|June|July|August|September|October|November|December)$', line, re.IGNORECASE)
            if month_match:
                current_month = month_match.group(1)
                continue
            
            # Look for date patterns followed by event titles
            # Pattern: [Event Title] MM/DD/YYYY
            event_match = re.search(r'\[([^\]]+)\]\s*(\d{1,2}/\d{1,2}/\d{4})', line)
            if event_match:
                title = event_match.group(1).strip()
                date_str = event_match.group(2)
                
                try:
                    start_date = datetime.strptime(date_str, '%m/%d/%Y')
                except:
                    continue
                    
                from models import Event
                import hashlib
                
                event_date = start_date.strftime('%Y-%m-%d')
                event_id = hashlib.md5(f"nyipla_{title}_{event_date}".encode()).hexdigest()[:12]
                
                events.append(Event(
                    id=event_id,
                    name=title,
                    startDate=event_date,
                    description=title,
                    locationName="NYIPLA Event",
                    url="https://www.nyipla.org/nyipla/events.asp"
                ))
                continue
            
            # Alternative pattern: Event title on one line, date on next
            if current_month and re.search(r'^[A-Z]', line) and len(line) > 10:
                # This might be an event title, check next line for date
                if i + 1 < len(lines):
                    next_line = lines[i + 1].strip()
                    date_match = re.search(r'(\d{1,2}/\d{1,2}/\d{4})', next_line)
                    if date_match:
                        try:
                            start_date = datetime.strptime(date_match.group(1), '%m/%d/%Y')
                            from models import Event
                            import hashlib
                            
                            event_date = start_date.strftime('%Y-%m-%d')
                            event_id = hashlib.md5(f"nyipla_{line}_{event_date}".encode()).hexdigest()[:12]
                            
                            events.append(Event(
                                id=event_id,
                                name=line,
                                startDate=event_date,
                                description=line,
                                locationName="NYIPLA Event",
                                url="https://www.nyipla.org/nyipla/events.asp"
                            ))
                        except:
                            pass
        
        return events
    
    def get_event_details(self, event_url):
        """Fetch additional details from individual event page"""
        try:
            response = requests.get(event_url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract more detailed information
            details = {}
            
            # Look for date/time information
            date_elem = soup.find('td', string=re.compile(r'Event Date', re.IGNORECASE))
            if date_elem and date_elem.find_next_sibling():
                details['date_info'] = date_elem.find_next_sibling().get_text(strip=True)
            
            # Look for location information  
            location_elem = soup.find('td', string=re.compile(r'Location', re.IGNORECASE))
            if location_elem and location_elem.find_next_sibling():
                details['location'] = location_elem.find_next_sibling().get_text(strip=True)
            
            # Look for description
            desc_elem = soup.find('td', string=re.compile(r'Description', re.IGNORECASE))
            if desc_elem and desc_elem.find_next_sibling():
                details['description'] = desc_elem.find_next_sibling().get_text(strip=True)
                
            return details
            
        except Exception as e:
            print(f"Error fetching event details from {event_url}: {e}")
            return {} 