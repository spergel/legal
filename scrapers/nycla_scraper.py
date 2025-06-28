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

class NyclaScaper(BaseScraper):
    
    def get_events(self):
        events = []
        
        # NYCLA calendar URL
        url = "https://www.nycla.org/calendar/"
        
        try:
            # Add headers to bypass 403 Forbidden
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            }
            
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find all event elements in the calendar
            # Events are structured with class patterns like "tribe-events-calendar-month__day-cell"
            # and contain event details within
            
            # Look for events in the calendar grid and list views
            event_elements = soup.find_all(['article', 'div'], class_=re.compile(r'tribe-events|event'))
            
            if not event_elements:
                # Try alternative selectors based on the calendar structure
                event_elements = soup.find_all('h3', class_=re.compile(r'tribe-events'))
                
            # Also look for events in any list view
            for event_elem in soup.find_all(['h3', 'h4'], string=re.compile(r'.*Committee.*|.*CLE.*|.*Reception.*|.*Meeting.*', re.IGNORECASE)):
                event_elements.append(event_elem.parent if event_elem.parent else event_elem)
            
            for event_elem in event_elements:
                try:
                    event_data = self.extract_event_data(event_elem, url)
                    if event_data:
                        events.append(event_data)
                        print(f"Found event: {event_data['title']}")
                except Exception as e:
                    print(f"Error extracting event: {e}")
                    continue
                    
            # Also try to extract from any structured data or JSON-LD
            scripts = soup.find_all('script', type='application/ld+json')
            for script in scripts:
                try:
                    import json
                    data = json.loads(script.string)
                    if isinstance(data, dict) and data.get('@type') == 'Event':
                        event_data = self.parse_json_ld_event(data)
                        if event_data:
                            events.append(event_data)
                except:
                    pass
                    
        except Exception as e:
            print(f"Error fetching NYCLA events: {e}")
            
        return events
    
    def extract_event_data(self, event_elem, base_url):
        """Extract event data from HTML element"""
        
        # Extract title
        title_elem = event_elem.find(['h1', 'h2', 'h3', 'h4', 'h5', 'a'], class_=re.compile(r'title|event-title|tribe-events'))
        if not title_elem:
            title_elem = event_elem.find(['h1', 'h2', 'h3', 'h4', 'h5'])
        if not title_elem:
            title_elem = event_elem.find('a')
            
        if not title_elem:
            return None
            
        title = title_elem.get_text(strip=True)
        if not title or len(title) < 3:
            return None
            
        # Extract link
        link = None
        link_elem = event_elem.find('a', href=True)
        if link_elem:
            link = urljoin(base_url, link_elem['href'])
        
        # Extract date and time
        date_str = None
        time_str = None
        
        # Look for date/time information
        date_elem = event_elem.find(['time', 'span', 'div'], class_=re.compile(r'date|time|tribe-events'))
        if date_elem:
            date_str = date_elem.get_text(strip=True)
            
        # Look for @ symbol indicating time
        full_text = event_elem.get_text()
        if '@' in full_text:
            parts = full_text.split('@')
            if len(parts) > 1:
                time_part = parts[1].strip()
                # Extract time portion
                time_match = re.search(r'(\d+:\d+\s*[ap]m)', time_part, re.IGNORECASE)
                if time_match:
                    time_str = time_match.group(1)
        
        # Try to parse date from various formats in the text
        if not date_str:
            text = event_elem.get_text()
            # Look for date patterns like "May 27", "June 2", etc.
            date_match = re.search(r'(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})', text, re.IGNORECASE)
            if date_match:
                month = date_match.group(1)
                day = date_match.group(2)
                current_year = datetime.now().year
                date_str = f"{month} {day}, {current_year}"
        
        # Extract description
        description = ""
        desc_elem = event_elem.find(['p', 'div'], class_=re.compile(r'description|content|summary'))
        if desc_elem:
            description = desc_elem.get_text(strip=True)
        else:
            # Get text content but clean it up
            description = event_elem.get_text(strip=True)
            # Remove title from description if it's included
            if title in description:
                description = description.replace(title, '').strip()
            # Limit description length
            if len(description) > 300:
                description = description[:300] + "..."
        
        # Extract location (if any)
        location = ""
        location_elem = event_elem.find(['span', 'div'], class_=re.compile(r'location|venue|address'))
        if location_elem:
            location = location_elem.get_text(strip=True)
        
        # Default to NYCLA location if no specific location found
        if not location:
            location = "NYCLA, 111 Broadway, 10th Floor, New York, NY 10006"
        
        # Try to parse the date
        start_date = None
        if date_str:
            try:
                # Try various date formats
                for fmt in ['%B %d, %Y', '%B %d @ %I:%M %p', '%m/%d/%Y', '%Y-%m-%d']:
                    try:
                        start_date = datetime.strptime(date_str.split('@')[0].strip(), fmt)
                        break
                    except:
                        continue
                        
                if not start_date:
                    # Try with current year
                    try:
                        start_date = datetime.strptime(f"{date_str.split('@')[0].strip()}, {datetime.now().year}", '%B %d, %Y')
                    except:
                        pass
                        
            except Exception as e:
                print(f"Could not parse date '{date_str}': {e}")
        
        # If no date parsed, skip this event
        if not start_date:
            return None
            
        from models import Event
        import hashlib
        
        # Generate a unique ID for the event
        event_id = hashlib.md5(f"nycla_{title}_{start_date.strftime('%Y-%m-%d')}".encode()).hexdigest()[:12]
        
        return Event(
            id=event_id,
            name=title,
            startDate=start_date.strftime('%Y-%m-%d'),
            description=description,
            locationName=location,
            url=link or base_url
        )
    
    def parse_json_ld_event(self, data):
        """Parse event from JSON-LD structured data"""
        try:
            title = data.get('name', '')
            start_date_str = data.get('startDate', '')
            
            if not title or not start_date_str:
                return None
                
            # Parse ISO date
            try:
                start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
            except:
                return None
                
            description = data.get('description', '')
            location_data = data.get('location', {})
            location = ''
            
            if isinstance(location_data, dict):
                if location_data.get('name'):
                    location = location_data['name']
                elif location_data.get('address'):
                    addr = location_data['address']
                    if isinstance(addr, dict):
                        location = f"{addr.get('streetAddress', '')}, {addr.get('addressLocality', '')}, {addr.get('addressRegion', '')} {addr.get('postalCode', '')}"
                    else:
                        location = str(addr)
            
            from models import Event
            import hashlib
            
            # Generate a unique ID for the event
            event_id = hashlib.md5(f"nycla_{title}_{start_date.strftime('%Y-%m-%d')}".encode()).hexdigest()[:12]
            
            return Event(
                id=event_id,
                name=title,
                startDate=start_date.strftime('%Y-%m-%d'),
                description=description,
                locationName=location or "NYCLA, 111 Broadway, 10th Floor, New York, NY 10006",
                url=data.get('url', '')
            )
            
        except Exception as e:
            print(f"Error parsing JSON-LD event: {e}")
            return None 