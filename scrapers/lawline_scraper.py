#!/usr/bin/env python3
"""
Lawline CLE Events Scraper

This scraper fetches CLE courses and events from Lawline using their API:
https://www.lawline.com/api/catalog/instant-search

Lawline provides online CLE courses for attorneys.
"""

import logging
import requests
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from base_scraper import BaseScraper
from models import Event
import hashlib
import re
import json
import brotli
from categorization_helper import EventCategorizer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LawlineScraper(BaseScraper):
    """Scraper for Lawline CLE courses and events from their API."""
    
    def __init__(self):
        super().__init__(community_id="com_lawline")
        self.api_url = "https://www.lawline.com/api/catalog/instant-search"
        self.base_url = "https://www.lawline.com"
        
    def get_events(self) -> List[Event]:
        """Fetch and parse events from Lawline API."""
        logger.info(f"Fetching events from Lawline API: {self.api_url}")
        
        try:
            # Set up headers to mimic the browser request, including cookies
            headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Origin': 'https://www.lawline.com',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15',
                'Referer': 'https://www.lawline.com/cle/courses/webcast?format=Webcast',
                'X-Requested-With': 'XMLHttpRequest',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Dest': 'empty',
                'Accept-Encoding': 'gzip, deflate, br',
                'Priority': 'u=3, i',
                'sentry-trace': '7e61173e8709470fa0f65b6936a82449-a51897c5774170c0-0',
                'baggage': 'sentry-trace_id=7e61173e8709470fa0f65b6936a82449,sentry-sample_rate=0.05,sentry-public_key=881d6c573988ab32d2627e6b92cbd9c6,sentry-environment=prod,sentry-sampled=false,sentry-sample_rand=0.106576',
                'Cookie': 'AWSALBAPP-0=AAAAAAAAAAAXkCcvGU0uB5uv12eus+NJGqLwUQqxObwydir+DOQrvu/6z3VIkr5sD1rlufdvM6Fo0O8n3OnVkasV34L6ws//GbKPt6yn+GToHaAQoSVU33/LUvZAXM3RLs2m88qtTsrnB9M=; AWSALBAPP-1=_remove_; AWSALBAPP-2=_remove_; AWSALBAPP-3=_remove_; ui_session=eyJpdiI6IldZeFFDZVdadXMrL2R0YUJQR2ZrOHc9PSIsInZhbHVlIjoiVHQveVVtbnpDMVQ3MnU5RnQrUEF1VXdKRzZZSitBREpOb3cwTitTQVRwbVlDeXJKRG0zSVRCSFFBM2x3Sjl2VVl2ZG9IZVpHNld5WlRoN0hZRmV4aEV5RGQ0RkVsQlVyMzB3cEVMTjBqNTNPa3E5R1NMMm9uOTVjOEJJTkR6MWUiLCJtYWMiOiJkNTMyNjI3OGRjOWNkYjdmYzI3YmE1NWJmNTFmNGZkODZkYTA3ZGY0ODViNzUyZWQzZmYzNmE3YTJjODdlMzc3IiwidGFnIjoiIn0%3D; __fx=e1b384d0-6e5f-4933-a1bd-8c5d8fcdefd3; _ga=GA1.1.779019418.1750599521; _ga_299T5ESQXE=GS2.1.s1750599519$o1$g1$t1750600662$j51$l0$h173354607; _vwo_uuid_v2=D41DAE22D6B688FBE97A9ABD911AB341F|9648888f5e61343885268be122d9c20e; __zlcmid=1SFnhmVNfXiBAnT; __hssc=8662698.3.1750599521590; __hstc=8662698.4650e21c82eb5533297730697f2b8bfc.1750599521590.1750599521590.1750599521590.1; _ce.s=lcw~1750599522237~v11.fsvd~eyJ1cmwiOiJsYXdsaW5lLmNvbS9jbGUvY291cnNlcy93ZWJjYXN0IiwicmVmIjoiIiwidXRtIjpbXX0%3D~v11ls~362b0030-4f6e-11f0-bba5-d717db67da7e~v~3d028e8170295169d45ed04fd1d4a5afbdba3b57~vir~new~lva~1750599521983~vpv~0~v11.cs~455138~v11.s~362b0030-4f6e-11f0-bba5-d717db67da7e~v11.vs~3d028e8170295169d45ed04fd1d4a5afbdba3b57~v11.ss~1750599522234~lcw~1750600654757; _hjSessionUser_759783=eyJpZCI6IjZlMTlkOGE1LTAxOTAtNTg3ZC1iMDAyLWJmNzk0YWE1MGE2MyIsImNyZWF0ZWQiOjE3NTA1OTk1MjE3MjYsImV4aXN0aW5nIjp0cnVlfQ==; cebsp_=3; hubspotutk=4650e21c82eb5533297730697f2b8bfc; _uetsid=3593c3104f6e11f092b605787b0e47cf; _uetvid=359403804f6e11f09a1335ba53587dbc; _hjHasCachedUserAttributes=true; _hjSession_759783=eyJpZCI6ImZiZTY3MjZhLTFkN2EtNDIyYS1iYjg0LTIxMjM0ZjhjODkyYSIsImMiOjE3NTA1OTk1MjE3MjgsInMiOjAsInIiOjAsInNiIjowLCJzciI6MCwic2UiOjAsImZzIjoxLCJzcCI6MX0=; cookieyes-consent=consentid:TzljcGFOWkF2OHRESURkSXZucDlvaXAyYjg1SU9WSXU,consent:no,action:yes,necessary:yes,functional:yes,analytics:yes,advertisement:yes; _ce.clock_data=48%2C108.30.197.82%2C1%2Ce5bb992aa8f6560c8cdd0fdea5a98cbe%2CSafari%2CUS; __hssrc=1; _gcl_au=1.1.369936541.1750599521; cebs=1; fx_info={%22source%22:%22direct%22%2C%22medium%22:%22direct%22%2C%22term%22:null%2C%22content%22:null%2C%22campaign%22:null%2C%22segment%22:null%2C%22referrer%22:%22%22%2C%22pageUrl%22:%22https://www.lawline.com/%22%2C%22fx_matchtype%22:null%2C%22fx_network%22:null%2C%22fx_creative%22:null%2C%22fx_keyword%22:null%2C%22fx_placement%22:null%2C%22fx_aceid%22:null%2C%22fx_adposition%22:null%2C%22utm_source%22:null%2C%22utm_medium%22:null%2C%22utm_segment%22:null%2C%22utm_campaign%22:null%2C%22utm_term%22:null%2C%22gclid%22:null%2C%22gbraid%22:null%2C%22wbraid%22:null%2C%22msclkid%22:null%2C%22fbclid%22:null%2C%22twclid%22:null%2C%22li_fat_id%22:null%2C%22epik%22:null%2C%22pp%22:null%2C%22ip%22:%22108.30.197.82%22%2C%22location%22:{%22country%22:%22US%22%2C%22region%22:%22NY%22%2C%22city%22:%22New%20York%22%2C%22cityLatLong%22:[%2240.712775%22%2C%22-74.005973%22]%2C%22userIP%22:%22108.30.197.82%22}%2C%22landingPage%22:%22/cle/courses/webcast%22}; fx_referrer='
            }
            
            # Prepare the request payload for searching webcast courses
            payload = {
                "query": "",
                "filters": {
                    "format": ["Webcast"],
                    "state": [],
                    "practice_area": [],
                    "credit_type": [],
                    "credit_amount": [],
                    "date_range": "next_30_days"  # Get courses in next 30 days
                },
                "sort": "date",
                "page": 1,
                "per_page": 50
            }
            
            logger.info(f"Sending payload: {json.dumps(payload, indent=2)}")
            
            # Fetch the events data
            response = self.session.post(
                self.api_url, 
                json=payload,
                headers=headers, 
                timeout=30
            )
            response.raise_for_status()
            
            # Debug: Log the response
            logger.info(f"Response status: {response.status_code}")
            logger.info(f"Response headers: {dict(response.headers)}")
            
            # Try to get the response text first
            response_text = response.text
            logger.info(f"Response text (first 500 chars): {response_text[:500]}")
            
            # If the response is not valid JSON, try decompressing Brotli
            try:
                data = response.json()
                logger.info(f"Successfully parsed JSON response")
                logger.info(f"Response keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
            except Exception as e:
                logger.error(f"JSON decode failed: {e}")
                # Try Brotli decompress
                try:
                    decompressed = brotli.decompress(response.content)
                    logger.info(f"Brotli decompressed response (first 500 chars): {decompressed[:500]}")
                    try:
                        data = json.loads(decompressed)
                        logger.info(f"Successfully parsed JSON after Brotli decompress")
                        logger.info(f"Response keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
                    except Exception as e2:
                        logger.error(f"JSON decode after Brotli decompress failed: {e2}")
                        logger.error(f"Raw Brotli response: {decompressed[:500]}")
                        return []
                except Exception as e3:
                    logger.error(f"Brotli decompress failed: {e3}")
                    logger.error(f"Raw response bytes: {response.content[:500]}")
                    return []
            
            events = []
            
            # Parse courses from the response - Lawline returns courses in a different structure
            courses = data.get('hits', [])  # Lawline uses 'hits' for search results
            logger.info(f"Found {len(courses)} courses")
            
            for course_data in courses:
                try:
                    event = self._parse_course(course_data)
                    if event:
                        events.append(event)
                except Exception as e:
                    logger.warning(f"Failed to parse course '{course_data.get('name', 'Unknown')}': {e}")
                    continue
            
            # Also check for any live events or webinars
            live_events = data.get('live_events', [])
            logger.info(f"Found {len(live_events)} live events")
            
            for event_data in live_events:
                try:
                    event = self._parse_live_event(event_data)
                    if event:
                        events.append(event)
                except Exception as e:
                    logger.warning(f"Failed to parse live event '{event_data.get('name', 'Unknown')}': {e}")
                    continue
            
            logger.info(f"Successfully parsed {len(events)} events from Lawline")
            return events
            
        except requests.RequestException as e:
            logger.error(f"Failed to fetch events from Lawline API: {e}")
            return []
        except Exception as e:
            logger.error(f"Failed to parse Lawline events: {e}")
            logger.error(f"Exception type: {type(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return []
    
    def _parse_course(self, course_data: Dict[str, Any]) -> Optional[Event]:
        """Parse an individual course from the API response."""
        try:
            # Generate a unique ID based on course ID and name
            course_id = course_data.get('id')
            name = course_data.get('name', '')
            event_id = self._generate_event_id(course_id, name)
            
            # Extract basic course information
            description = course_data.get('description', '')
            course_type = course_data.get('course_type_text', '')
            topics = course_data.get('topics', [])
            faculty = course_data.get('faculty', '')
            
            # Extract dates - Lawline uses timestamp format
            date_timestamp = course_data.get('date_timestamp')
            time_timestamp = course_data.get('time')
            
            # Parse timestamps
            start_datetime = self._parse_timestamp(date_timestamp) if date_timestamp else None
            end_datetime = None  # Lawline doesn't seem to provide end times
            
            # Extract CLE credits from credits array
            cle_credits = self._extract_cle_credits_from_lawline(course_data.get('credits', []))
            
            # Extract image
            image_url = course_data.get('photo_url')
            if image_url and not image_url.startswith('http'):
                image_url = f"https:{image_url}"
            
            # Create categories from topics
            categories = [topic.get('name', '').strip() for topic in topics if topic.get('name')]
            
            # Determine event type
            event_type = self._determine_event_type(course_type, name)
            
            # Create description
            full_description = self._create_lawline_description(course_data)
            
            # Extract price information
            plan = course_data.get('plan', '')
            price = self._extract_lawline_price(plan)
            
            # Create metadata
            metadata = {
                "source": "Lawline",
                "api_url": self.api_url,
                "course_type": course_type,
                "topics": topics,
                "faculty": faculty,
                "plan": plan,
                "difficulty_level": course_data.get('difficulty_level'),
                "is_live": course_data.get('is_live', False),
                "has_certificate": course_data.get('has_certificate', False),
                "has_closed_captions": course_data.get('has_closed_captions', False),
                "production_date": course_data.get('production_date_formatted'),
                "raw_course_data": {
                    "id": course_id,
                    "slug": course_data.get('slug'),
                    "url": course_data.get('url'),
                    "created_by": course_data.get('created_by'),
                    "type": course_data.get('type'),
                    "is_groupcast": course_data.get('is_groupcast'),
                    "is_hosted_externally": course_data.get('is_hosted_externally'),
                    "webcast_in_progress": course_data.get('webcast_in_progress', False)
                }
            }
            
            # Create the Event object
            event = Event(
                id=event_id,
                name=name,
                description=full_description,
                startDate=start_datetime.isoformat() if start_datetime else "",
                endDate=end_datetime.isoformat() if end_datetime else None,
                communityId=self.community_id,
                image=image_url,
                price=price,
                event_type=event_type,
                cle_credits=cle_credits,
                metadata=metadata
            )
            
            # Use centralized categorization
            base_categories = ['CLE Provider', 'Legal Events']
            if categories:
                base_categories.extend(categories)
            final_categories = EventCategorizer.categorize_event(name, full_description, base_categories)
            event.category = final_categories
            
            return event
            
        except Exception as e:
            logger.error(f"Error parsing Lawline course '{course_data.get('name', 'Unknown')}': {e}")
            return None
    
    def _parse_live_event(self, event_data: Dict[str, Any]) -> Optional[Event]:
        """Parse a live event from the API response."""
        try:
            # Similar parsing logic for live events
            event_id = event_data.get('id')
            title = event_data.get('title', '')
            event_id_str = self._generate_event_id(event_id, title)
            
            # Extract basic information
            description = event_data.get('description', '')
            start_date = event_data.get('start_date')
            end_date = event_data.get('end_date')
            
            # Parse dates
            start_datetime = self._parse_datetime(start_date) if start_date else None
            end_datetime = self._parse_datetime(end_date) if end_date else None
            
            # Extract CLE credits
            cle_credits = self._extract_cle_credits(event_data.get('credit_info', {}))
            
            # Create metadata
            metadata = {
                "source": "Lawline",
                "api_url": self.api_url,
                "event_type": "live_event",
                "raw_event_data": event_data
            }
            
            # Create the Event object
            event = Event(
                id=event_id_str,
                name=title,
                description=description,
                startDate=start_datetime.isoformat() if start_datetime else "",
                endDate=end_datetime.isoformat() if end_datetime else None,
                communityId=self.community_id,
                event_type="Live Event",
                cle_credits=cle_credits,
                metadata=metadata
            )
            
            return event
            
        except Exception as e:
            logger.error(f"Error parsing Lawline live event '{event_data.get('title', 'Unknown')}': {e}")
            return None
    
    def _generate_event_id(self, event_id: Optional[int], title: str) -> str:
        """Generate a unique event ID based on event ID and title."""
        if event_id:
            return f"lawline_{event_id}"
        else:
            # Fallback to title-based hash
            content = f"lawline_{title}"
            return f"lawline_{hashlib.md5(content.encode()).hexdigest()[:12]}"
    
    def _parse_datetime(self, date_str: str) -> Optional[datetime]:
        """Parse datetime string."""
        try:
            # Handle various date formats from Lawline
            if date_str:
                # Try ISO format first
                try:
                    return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                except ValueError:
                    # Try other common formats
                    for fmt in ['%Y-%m-%d %H:%M:%S', '%Y-%m-%d', '%m/%d/%Y']:
                        try:
                            return datetime.strptime(date_str, fmt)
                        except ValueError:
                            continue
            return None
        except Exception as e:
            logger.warning(f"Failed to parse datetime '{date_str}': {e}")
            return None
    
    def _extract_cle_credits(self, credit_info: Dict[str, Any]) -> Optional[float]:
        """Extract CLE credits from credit information."""
        try:
            # Check for total credits
            total_credits = credit_info.get('total_credits')
            if total_credits:
                return float(total_credits)
            
            # Check for specific credit types
            credit_types = credit_info.get('credit_types', {})
            for credit_type, amount in credit_types.items():
                if amount and amount > 0:
                    return float(amount)
            
            return None
        except (ValueError, TypeError):
            return None
    
    def _extract_price(self, price_info: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Extract price information."""
        try:
            if not price_info:
                return None
            
            return {
                "amount": price_info.get('amount'),
                "currency": price_info.get('currency', 'USD'),
                "formatted": price_info.get('formatted'),
                "type": price_info.get('type', 'one_time')
            }
        except Exception:
            return None
    
    def _determine_event_type(self, format_type: str, title: str) -> str:
        """Determine the type of event based on format and title."""
        text = f"{format_type} {title}".lower()
        
        if any(word in text for word in ['webcast', 'webinar', 'online']):
            return 'Webinar'
        elif any(word in text for word in ['live', 'in-person']):
            return 'Live Event'
        elif any(word in text for word in ['course', 'cle']):
            return 'CLE Course'
        else:
            return 'Event'
    
    def _parse_timestamp(self, timestamp: int) -> Optional[datetime]:
        """Parse Unix timestamp from Lawline."""
        try:
            if timestamp:
                return datetime.fromtimestamp(timestamp, tz=timezone.utc)
            return None
        except Exception as e:
            logger.warning(f"Failed to parse timestamp '{timestamp}': {e}")
            return None
    
    def _extract_cle_credits_from_lawline(self, credits: List[Dict[str, Any]]) -> Optional[float]:
        """Extract CLE credits from Lawline's credits array."""
        try:
            total_credits = 0.0
            for credit in credits:
                credit_types = credit.get('credit_types', [])
                for credit_type in credit_types:
                    # Look for credit amount in the credit type
                    amount = credit_type.get('amount')
                    if amount:
                        try:
                            total_credits += float(amount)
                        except (ValueError, TypeError):
                            continue
            
            return total_credits if total_credits > 0 else None
        except Exception:
            return None
    
    def _extract_lawline_price(self, plan: str) -> Optional[Dict[str, Any]]:
        """Extract price information from Lawline plan."""
        try:
            if not plan:
                return None
            
            # Lawline plans indicate pricing tiers
            return {
                "type": "subscription" if plan.lower() in ['plus', 'premium'] else "one_time",
                "plan": plan,
                "formatted": f"{plan} Plan"
            }
        except Exception:
            return None
    
    def _create_lawline_description(self, course_data: Dict[str, Any]) -> str:
        """Create a comprehensive description from Lawline course data."""
        description_parts = []
        
        # Add main description
        if course_data.get('description'):
            description_parts.append(course_data['description'])
        
        # Add faculty information
        faculty = course_data.get('faculty', '')
        if faculty:
            # Remove HTML tags from faculty
            import re
            faculty_clean = re.sub(r'<[^>]+>', '', faculty)
            description_parts.append(f"Faculty: {faculty_clean}")
        
        # Add course type
        course_type = course_data.get('course_type_text')
        if course_type:
            description_parts.append(f"Format: {course_type}")
        
        # Add difficulty level
        difficulty = course_data.get('difficulty_level')
        if difficulty:
            description_parts.append(f"Level: {difficulty}")
        
        # Add topics
        topics = course_data.get('topics', [])
        if topics:
            topic_names = [topic.get('name', '').strip() for topic in topics if topic.get('name')]
            if topic_names:
                description_parts.append(f"Topics: {', '.join(topic_names)}")
        
        # Add production date
        production_date = course_data.get('production_date_formatted')
        if production_date:
            description_parts.append(f"Production Date: {production_date}")
        
        # Add plan information
        plan = course_data.get('plan')
        if plan:
            description_parts.append(f"Plan: {plan}")
        
        # Add credits information
        credits = course_data.get('credits', [])
        if credits:
            credit_info = []
            for credit in credits:
                state_name = credit.get('state_name', {}).get('value', 'Unknown State')
                credit_types = credit.get('credit_types', [])
                for credit_type in credit_types:
                    type_name = credit_type.get('name', {}).get('value', 'Unknown Type')
                    amount = credit_type.get('amount')
                    if amount:
                        credit_info.append(f"{state_name}: {amount} {type_name}")
            
            if credit_info:
                description_parts.append(f"CLE Credits: {'; '.join(credit_info)}")
        
        return '\n\n'.join(description_parts) if description_parts else None

def main():
    """Main function to run the scraper."""
    scraper = LawlineScraper()
    events = scraper.run()
    print(f"Scraped {len(events)} events from Lawline")
    
    # Print some sample events
    for i, event in enumerate(events[:3]):
        print(f"\nEvent {i+1}:")
        print(f"  Name: {event.name}")
        print(f"  Date: {event.startDate}")
        print(f"  Type: {event.event_type}")
        print(f"  Categories: {event.category}")
        if event.cle_credits:
            print(f"  CLE Credits: {event.cle_credits}")
        if event.price:
            print(f"  Price: {event.price.get('formatted', 'N/A')}")

if __name__ == "__main__":
    main() 