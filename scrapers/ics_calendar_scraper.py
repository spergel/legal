import os
import json
import requests
import hashlib
import logging
import pytz
import re
from bs4 import BeautifulSoup
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from ics import Calendar, Event as ICSEvent
from base_scraper import BaseScraper
from models import Event
from calendar_configs import ICS_CALENDARS

# Setup paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

# Directory for reading config files like communities.json
CONFIG_DATA_DIR = os.path.join(PROJECT_ROOT, 'public', 'data')

# Directory for scraper's own output (will be refined in later refactoring stages)
OUTPUT_DATA_DIR = os.path.join(PROJECT_ROOT, 'scrapers', 'data')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.FileHandler('scraper.log'), logging.StreamHandler()]
)

# Load communities data
communities = {}
try:
    communities_file = os.path.join(CONFIG_DATA_DIR, 'communities.json') # Changed to CONFIG_DATA_DIR
    if os.path.exists(communities_file):
        with open(communities_file, 'r') as f:
            communities = {com['id']: com for com in json.load(f).get('communities', [])}
    else:
        logging.warning(f"Communities file not found: {communities_file} (Looking in public/data/)")
except Exception as e:
    logging.error(f"Error loading communities data from {CONFIG_DATA_DIR}: {e}")

def get_luma_event_details(event_url: str) -> Optional[Dict]:
    """Fetch detailed event information from Luma event page"""
    try:
        # Make sure we have a valid URL
        if not event_url or not isinstance(event_url, str):
            return None
            
        # Normalize URL format if needed
        if event_url.startswith('LOCATION:'):
            event_url = event_url.replace('LOCATION:', '')
            
        # Ensure URL is a Luma URL
        if 'lu.ma' not in event_url:
            return None
            
        logging.info(f"Fetching details from Luma event URL: {event_url}")
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(event_url, headers=headers, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract event details
        details = {}
        
        # Get event title
        title_elem = soup.find('h1', {'class': 'title'})
        if title_elem:
            details['title'] = title_elem.get_text(strip=True)
        
        # Get full description/about section
        about_section = soup.find('div', {'class': 'spark-content'})
        if about_section:
            details['full_description'] = about_section.get_text(strip=True)
            
        # Get actual capacity/attendee count
        attendees_div = soup.find('div', {'class': 'guests-string'})
        if attendees_div:
            attendee_text = attendees_div.get_text(strip=True)
            # Extract number from text like "212 Going"
            match = re.search(r'(\d+)\s+Going', attendee_text)
            if match:
                details['actual_capacity'] = int(match.group(1))
                
        # Get detailed location info
        location_div = soup.select('div.jsx-4155675949.content-card:contains("Location")')
        location_details = {
            'venue_name': '',
            'address': '',
            'room': '',
            'additional_info': '',
            'type': 'Offline'  # Default to offline
        }
        
        if location_div:
            # Get venue name
            venue_name = soup.select_one('div.jsx-33066475.info div:first-child')
            if venue_name:
                location_details['venue_name'] = venue_name.get_text(strip=True)
                
            # Get address
            address = soup.select_one('div.jsx-33066475.text-tinted.fs-sm.mt-1')
            if address:
                location_details['address'] = address.get_text(strip=True)
                
            # Check if this is an online event
            if 'Register to See Address' in soup.text or 'Online Event' in soup.text:
                location_details['type'] = 'Online'
                
        details['location_details'] = location_details
            
        # Get event date and time
        date_elem = soup.select_one('div.jsx-2370077516.title.text-ellipses')
        if date_elem and not date_elem.select_one('div.shimmer'):
            details['date_display'] = date_elem.get_text(strip=True)
            
        # Get event categories
        categories = []
        category_elems = soup.select('div.jsx-3250441484.event-categories a')
        for cat in category_elems:
            category_text = cat.get_text(strip=True)
            if category_text:
                categories.append(category_text)
        details['categories'] = categories
            
        # Get speaker details
        speakers = []
        speaker_divs = soup.select('div.jsx-3733653009.flex-center.gap-2')
        for speaker in speaker_divs:
            speaker_name = speaker.select_one('div.jsx-3733653009.fw-medium.text-ellipses')
            if speaker_name:
                speakers.append({
                    'name': speaker_name.get_text(strip=True),
                    'title': '',  # Could parse from description if available
                    'bio': ''     # Could parse from description if available
                })
        details['speakers'] = speakers
        
        # Get social media links
        social_links = []
        social_divs = soup.select('div.jsx-1428039309.social-links a')
        for link in social_divs:
            href = link.get('href')
            if href:
                social_links.append(href)
        details['social_links'] = social_links
        
        # Get event image URL
        image_elem = soup.select_one('img[fetchPriority="auto"][loading="eager"]')
        if image_elem:
            img_src = image_elem.get('src')
            if img_src:
                details['image_url'] = img_src
                
        # Extract price information
        price_info = {
            "amount": 0,
            "type": "Free",
            "currency": "USD",
            "details": ""
        }
        
        price_elem = soup.select_one('div.jsx-681273248.cta-wrapper')
        if price_elem:
            price_text = price_elem.get_text(strip=True)
            if any(term in price_text.lower() for term in ['$', 'usd', 'pay']):
                # Try to extract the price
                price_match = re.search(r'\$(\d+(\.\d+)?)', price_text)
                if price_match:
                    price_info = {
                        "amount": float(price_match.group(1)),
                        "type": "Paid",
                        "currency": "USD",
                        "details": price_text
                    }
        details['price_info'] = price_info
        
        return details
        
    except Exception as e:
        logging.error(f"Error fetching Luma event details: {e}")
        return None

def get_luma_events(ics_url):
    """Fetch and parse Luma calendar events from ICS feed"""
    try:
        logging.info(f"Fetching ICS feed from: {ics_url}")
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(ics_url, headers=headers, timeout=10)
        response.raise_for_status()
        
        if not response.text:
            logging.error(f"Empty response from ICS feed: {ics_url}")
            return []
            
        logging.info(f"Successfully fetched ICS feed, size: {len(response.text)} bytes")
        cal = Calendar(response.text)
        events = []
        now = datetime.now(pytz.utc)
        
        for event in cal.events:
            try:
                # Skip past events (end time in past)
                if event.end < now:
                    continue
                
                # Get event URL from:
                # 1. URL property
                # 2. Location field if it contains a Luma URL
                # 3. Description field if it contains a Luma URL
                event_url = getattr(event, 'url', '')
                location = getattr(event, 'location', '')
                description = getattr(event, 'description', '')
                
                # Check if location is a Luma URL
                if not event_url and location and 'lu.ma' in location:
                    event_url = location
                    
                # Alternative: Extract URL from description if needed
                if not event_url and description:
                    urls = re.findall(r'https?://lu\.ma/\S+', description)
                    if urls:
                        event_url = urls[0]
                
                # Get detailed event information if we have a URL
                event_details = get_luma_event_details(event_url) if event_url else None
                    
                events.append({
                    "uid": getattr(event, 'uid', ''),
                    "summary": getattr(event, 'name', ''),
                    "start": event.begin.datetime,
                    "end": event.end.datetime,
                    "location": location,
                    "description": description,
                    "organizer": getattr(event, 'organizer', ''),
                    "geo": getattr(event, 'geo', ''),
                    "url": event_url,
                    "additional_details": event_details
                })
            except Exception as e:
                logging.error(f"Error processing event: {e}")
                continue
        
        logging.info(f"Found {len(events)} upcoming events")
        return events
    except requests.exceptions.RequestException as e:
        logging.error(f"Error fetching ICS feed: {e}")
        return []
    except Exception as e:
        logging.error(f"Unexpected error processing ICS feed: {e}")
        return []

def parse_location(raw_location):
    """Extract structured location data from ICS location field"""
    if not raw_location:
        return {
            "name": "",
            "address": "",
            "type": "Online"
        }
    
    # Handle Luma URL-based locations
    if 'lu.ma' in raw_location:
        event_details = get_luma_event_details(raw_location)
        if event_details and 'location_details' in event_details:
            loc_details = event_details['location_details']
            return {
                "name": loc_details.get('venue_name', 'Event Location'),
                "address": loc_details.get('address', raw_location),
                "type": loc_details.get('type', 'Offline'),
                "room": loc_details.get('room', ''),
                "additional_info": loc_details.get('additional_info', '')
            }
        # Fallback if we couldn't extract details
        return {
            "name": "Luma Event",
            "address": raw_location,
            "type": "Offline"
        }
    
    # Handle other URL-based locations
    if raw_location.startswith('http'):
        return {
            "name": "Online Event",
            "address": raw_location,
            "type": "Online"
        }
    
    # Split address lines
    parts = [p.strip() for p in raw_location.split('\n') if p.strip()]
    
    # Special handling for common patterns
    if len(parts) == 1:
        # If it's just one line, treat it as both name and address
        return {
            "name": parts[0],
            "address": parts[0],
            "type": "Offline"
        }
    
    # Try to intelligently determine venue name vs address
    # Look for common address patterns in the first line
    first_line = parts[0].lower()
    if (any(first_line.startswith(str(i)) for i in range(10)) or  # Starts with number
        '@' in first_line or  # Contains @ symbol
        any(word in first_line for word in ['street', 'st.', 'avenue', 'ave.', 'road', 'rd.', 'boulevard', 'blvd.'])):
        # First line looks like an address, try to find a venue name in subsequent lines
        address = parts[0]
        name = parts[1] if len(parts) > 1 else parts[0]
    else:
        # First line is probably the venue name
        name = parts[0]
        address = '\n'.join(parts[1:]) if len(parts) > 1 else parts[0]
    
    return {
        "name": name,
        "address": address,
        "type": "Offline"
    }

def clean_description(desc):
    """Remove redundant boilerplate from descriptions"""
    return desc.replace("Find more information on https://lu.ma/nyc-tech", "").strip()

def parse_price(desc):
    """Extract price info from description"""
    if "free" in desc.lower():
        return {
            "amount": 0,
            "type": "Free",
            "currency": "USD",
            "details": "Status Unknown"
        }
    
    # Add more price parsing logic as needed
    return {
        "amount": 0,
        "type": "Free", 
        "currency": "USD",
        "details": ""
    }

def extract_speakers(desc):
    """Extract speaker names from description"""
    if "Hosted by" in desc:
        return [s.strip() for s in desc.split("Hosted by")[-1].split("\n")[0].split("&")]
    return []

def convert_ics_event(ics_event, community_id):
    """Convert ICS event to our standardized format with improved parsing"""
    eastern = pytz.timezone('America/New_York')
    
    # Generate unique ID
    unique_id = f"{ics_event['summary']}{ics_event['start']}".encode()
    event_id = hashlib.md5(unique_id).hexdigest()[:8]
    
    # Handle datetime conversion
    start_date = ics_event['start'].astimezone(eastern)
    end_date = ics_event['end'].astimezone(eastern)
    
    # Get additional details
    additional_details = ics_event.get('additional_details', {})
    
    # Parse location data
    raw_location = ics_event.get('location', '')
    venue = parse_location(raw_location)
    
    # Update venue with detailed location if available
    if additional_details and 'location_details' in additional_details:
        loc_details = additional_details['location_details']
        venue.update({
            'name': loc_details.get('venue_name', venue['name']),
            'address': loc_details.get('address', venue['address']),
            'room': loc_details.get('room', ''),
            'additional_info': loc_details.get('additional_info', ''),
            'type': loc_details.get('type', venue['type'])
        })
    
    # Extract price from description or additional details
    price_info = additional_details.get('price_info', parse_price(ics_event.get('description', '')))
    
    # Clean description
    description = clean_description(ics_event.get('description', ''))
    
    # Use full description if available from Luma
    if additional_details and 'full_description' in additional_details:
        description = additional_details['full_description']
    
    # Get actual capacity if available
    capacity = additional_details.get('actual_capacity', 100) if additional_details else 100
    
    # Get image URL if available
    image = "fractal-community.jpg"  # Default image
    if additional_details and 'image_url' in additional_details:
        # Extract just the filename part for local storage
        image_url = additional_details['image_url']
        if image_url:
            # Generate a filename from the URL
            image_hash = hashlib.md5(image_url.encode()).hexdigest()[:8]
            image = f"luma-event-{image_hash}.jpg"
            
            # Optionally download the image (uncomment if needed)
            # try:
            #     img_response = requests.get(image_url)
            #     if img_response.status_code == 200:
            #         os.makedirs('../../public/images/events', exist_ok=True)
            #         with open(f'../../public/images/events/{image}', 'wb') as img_file:
            #             img_file.write(img_response.content)
            # except Exception as e:
            #     logging.error(f"Failed to download image: {e}")
    
    # Get categories
    categories = ["Tech"]  # Default category
    if additional_details and 'categories' in additional_details and additional_details['categories']:
        categories = additional_details['categories']
    
    # Set location ID based on community
    location_id = "loc_tbd"
    if community_id == "com_fractal":
        location_id = "loc_fractal"
    elif community_id == "com_telos":
        location_id = "loc_telos"
    
    # Set source URL based on community
    source_url = ics_event.get('url')
    if community_id == "com_nyc_resistor":
        source_url = "https://www.nycresistor.com/participate/"
    
    return {
        "id": f"evt_{community_id}_{event_id}",
        "name": additional_details.get('title', ics_event['summary']),
        "type": categories[0] if categories else "Tech",
        "locationId": location_id,
        "communityId": community_id,
        "description": description,
        "startDate": start_date.isoformat(),
        "endDate": end_date.isoformat(),
        "category": categories,
        "price": price_info,
        "capacity": capacity,
        "registrationRequired": True,
        "tags": [],
        "image": image,
        "status": "upcoming",
        "metadata": {
            "source_url": source_url,
            "speakers": additional_details.get('speakers', []) if additional_details else extract_speakers(description),
            "venue": venue,
            "featured": False,
            "social_links": additional_details.get('social_links', []) if additional_details else []
        }
    }

def is_future_event(event: Dict) -> bool:
    """Check if event hasn't ended yet"""
    try:
        end_date_str = event.get('endDate')
        if not end_date_str:
            return True  # Assume ongoing if no end date
            
        # Parse both date-only and datetime formats
        if 'T' in end_date_str:
            end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
        else:
            end_date = datetime.fromisoformat(end_date_str).replace(tzinfo=pytz.utc)
            
        return end_date > datetime.now(pytz.utc)
        
    except Exception as e:
        print(f"Error parsing date for event {event.get('id')}: {e}")
        return False  # Exclude events with invalid dates

def main():
    all_events = []
    # Try to load existing events first
    try:
        output_file = os.path.join(OUTPUT_DATA_DIR, 'ics_calendar_events.json') # Use OUTPUT_DATA_DIR
        if os.path.exists(output_file):
            with open(output_file, 'r') as f:
                existing_data = json.load(f)
            all_events = existing_data.get('events', [])
            logging.info(f"Loaded {len(all_events)} existing events from {output_file}")
    except Exception as e:
        logging.error(f"Error loading existing events: {e}")
    
    for calendar_name, calendar_config in ICS_CALENDARS.items():
        logging.info(f"Fetching events for {calendar_name}")
        calendar_events = get_luma_events(calendar_config["id"])
        if calendar_events:
            converted_events = [convert_ics_event(event, calendar_config["community_id"]) for event in calendar_events]
            all_events.extend(converted_events)
            logging.info(f"Fetched {len(converted_events)} events from {calendar_name}")
        else:
            logging.warning(f"No events fetched from {calendar_name}")
    
    # Filter out past events
    filtered_events = [event for event in all_events if is_future_event(event)]
    
    # Save all fetched events
    output = {"events": filtered_events}
    
    # Create data directory if it doesn't exist
    os.makedirs(OUTPUT_DATA_DIR, exist_ok=True) # Use OUTPUT_DATA_DIR
    
    output_file = os.path.join(OUTPUT_DATA_DIR, 'ics_calendar_events.json') # Use OUTPUT_DATA_DIR
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    logging.info(f"Saved {len(filtered_events)} events to {output_file}")
    return output_file

class ICSCalendarScraper(BaseScraper):
    """Scraper for ICS calendar feeds (e.g., Luma)."""
    def __init__(self, community_id: str):
        super().__init__(community_id)
        self.ics_urls = ICS_CALENDARS.get(community_id, [])

    def get_events(self) -> List[Event]:
        events = []
        for ics_url in self.ics_urls:
            try:
                ics_events = get_luma_events(ics_url)
                for ics_event in ics_events:
                    event = convert_ics_event(ics_event, self.community_id)
                    if event:
                        events.append(event)
            except Exception as e:
                logging.error(f"Error processing ICS feed {ics_url}: {e}")
                continue
        return events

if __name__ == "__main__":
    main() 