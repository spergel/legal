import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import re
from urllib.parse import urljoin
import hashlib
try:
    from base_scraper import BaseScraper
    from models import Event
except ImportError:
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from base_scraper import BaseScraper
    from models import Event

class PliScraper(BaseScraper):
    
    def get_events(self):
        events = []
        
        # PLI programs/events URLs to try
        urls = [
            "https://www.pli.edu/programs",
            "https://www.pli.edu/programs/live",
            "https://www.pli.edu/events",
            "https://www.pli.edu/calendar"
        ]
        
        for url in urls:
            try:
                print(f"Trying URL: {url}")
                response = requests.get(url, timeout=30, headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                })
                
                if response.status_code == 200:
                    soup = BeautifulSoup(response.content, 'html.parser')
                    page_events = self.extract_events_from_page(soup, url)
                    events.extend(page_events)
                    print(f"Found {len(page_events)} events from {url}")
                    if page_events:  # If we found events, focus on this URL
                        break
                else:
                    print(f"Status {response.status_code} for {url}")
                    
            except Exception as e:
                print(f"Error fetching {url}: {e}")
                continue
        
        # Remove duplicates
        unique_events = []
        seen_titles = set()
        for event in events:
            if event.name.lower() not in seen_titles:
                unique_events.append(event)
                seen_titles.add(event.name.lower())
        
        print(f"Total unique PLI events found: {len(unique_events)}")
        return unique_events
    
    def extract_events_from_page(self, soup, base_url):
        """Extract events from a PLI page."""
        events = []
        
        # Look for common event listing patterns
        selectors_to_try = [
            # PLI specific patterns
            '.program-listing',
            '.event-listing', 
            '.course-listing',
            '.program-card',
            '.event-card',
            # Generic patterns
            '[class*="program"]',
            '[class*="event"]', 
            '[class*="course"]',
            '[class*="seminar"]',
            '.card',
            '.listing-item'
        ]
        
        for selector in selectors_to_try:
            event_containers = soup.select(selector)
            if event_containers:
                print(f"Found {len(event_containers)} containers with selector: {selector}")
                for container in event_containers[:20]:  # Limit to avoid noise
                    event = self.extract_event_from_container(container, base_url)
                    if event:
                        events.append(event)
                        print(f"Extracted: {event.name}")
                break
        
        # If no structured events found, look for text patterns
        if not events:
            events.extend(self.extract_events_from_text(soup.get_text(), base_url))
        
        return events
    
    def extract_event_from_container(self, container, base_url):
        """Extract event from a container element."""
        try:
            # Get all text from container
            text = container.get_text(strip=True)
            
            # Look for title - usually in h1, h2, h3, or strong tags
            title_element = container.find(['h1', 'h2', 'h3', 'h4', 'strong', 'a'])
            title = title_element.get_text(strip=True) if title_element else None
            
            if not title:
                # Fallback: use first meaningful line of text
                lines = [line.strip() for line in text.split('\n') if line.strip()]
                for line in lines:
                    if len(line) > 10 and not re.match(r'^\d+[/\-]\d+[/\-]\d+', line):
                        title = line
                        break
            
            if not title or len(title) < 5:
                return None
            
            # Clean up title
            title = re.sub(r'\s+', ' ', title)
            if len(title) > 200:
                title = title[:200] + "..."
            
            # Look for dates in the text
            date_patterns = [
                r'(\w+\s+\d{1,2},?\s+\d{4})',  # January 15, 2025
                r'(\d{1,2}/\d{1,2}/\d{4})',     # 1/15/2025
                r'(\d{4}-\d{1,2}-\d{1,2})',     # 2025-01-15
            ]
            
            start_date = None
            for pattern in date_patterns:
                matches = re.findall(pattern, text)
                for match in matches:
                    parsed_date = self.parse_date_string(match)
                    if parsed_date and parsed_date >= datetime.now() - timedelta(days=30):
                        start_date = parsed_date
                        break
                if start_date:
                    break
            
            # If no date found, use today + some reasonable offset
            if not start_date:
                start_date = datetime.now() + timedelta(days=30)
            
            # Look for URL
            link_element = container.find('a', href=True)
            event_url = base_url
            if link_element:
                href = link_element['href']
                if href.startswith('http'):
                    event_url = href
                elif href.startswith('/'):
                    event_url = urljoin(base_url, href)
            
            # Generate event ID
            event_id = hashlib.md5(f"pli_{title}_{start_date.strftime('%Y-%m-%d')}".encode()).hexdigest()[:12]
            
            return Event(
                id=event_id,
                name=title,
                startDate=start_date.strftime('%Y-%m-%d'),
                description=text[:500] if len(text) > len(title) else f"PLI Program: {title}",
                locationName="Practicing Law Institute",
                url=event_url
            )
            
        except Exception as e:
            print(f"Error extracting event from container: {e}")
            return None
    
    def extract_events_from_text(self, text_content, base_url):
        """Extract events from page text using patterns."""
        events = []
        
        # Look for CLE/program patterns
        patterns = [
            r'(?:CLE|Program|Course|Seminar):\s*([^.\n]+?).*?(\w+\s+\d{1,2},?\s+\d{4})',
            r'([^.\n]*(?:Law|Legal|CLE|Litigation|Contract|Corporate)[^.\n]*?).*?(\w+\s+\d{1,2},?\s+\d{4})',
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text_content, re.I | re.DOTALL)
            for title, date_str in matches[:10]:  # Limit to first 10 matches
                title = title.strip()
                if len(title) < 10 or len(title) > 200:
                    continue
                    
                try:
                    start_date = self.parse_date_string(date_str)
                    if start_date and start_date >= datetime.now() - timedelta(days=30):
                        event_id = hashlib.md5(f"pli_{title}_{start_date.strftime('%Y-%m-%d')}".encode()).hexdigest()[:12]
                        
                        events.append(Event(
                            id=event_id,
                            name=title,
                            startDate=start_date.strftime('%Y-%m-%d'),
                            description=f"PLI Program: {title}",
                            locationName="Practicing Law Institute",
                            url=base_url
                        ))
                        print(f"Text-extracted event: {title}")
                except Exception as e:
                    print(f"Error creating text event {title}: {e}")
                    continue
        
        return events
    
    def parse_date_string(self, date_str):
        """Parse various date string formats."""
        date_str = date_str.strip()
        
        formats = [
            '%B %d, %Y',    # January 15, 2025
            '%b %d, %Y',     # Jan 15, 2025
            '%m/%d/%Y',      # 1/15/2025
            '%Y-%m-%d',      # 2025-01-15
            '%B %d',         # January 15 (assume current/next year)
            '%b %d',         # Jan 15 (assume current/next year)
        ]
        
        for fmt in formats:
            try:
                parsed_date = datetime.strptime(date_str, fmt)
                # If no year specified, assume current year or next year if date has passed
                if '%Y' not in fmt:
                    current_year = datetime.now().year
                    parsed_date = parsed_date.replace(year=current_year)
                    if parsed_date < datetime.now():
                        parsed_date = parsed_date.replace(year=current_year + 1)
                return parsed_date
            except ValueError:
                continue
        
        return None

if __name__ == "__main__":
    scraper = PliScraper()
    events = scraper.get_events()
    print(f"Found {len(events)} PLI events")
    for event in events[:5]:
        print(f"- {event.name} on {event.startDate}")
