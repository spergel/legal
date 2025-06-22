#!/usr/bin/env python3
"""
Local scraper runner that saves events to JSON files for database import.
This script runs all scrapers and saves their output to the data/ directory.
"""

import json
import os
import sys
from datetime import datetime, timezone
from typing import List, Dict, Any
from models import Event

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def run_all_scrapers():
    """Run all available scrapers and save results to JSON files."""
    
    # List of all available scrapers with their module names, class names, and constructor arguments
    scraper_configs = [
        ("aabany_rss", "aabany_rss_scraper", "AABANYRSSScraper", {}),
        ("brooklynbar", "brooklynbar_scraper", "BrooklynBarScraper", {}),
        ("nysba", "nysba_scraper", "NYSBAScraper", {}),
        ("hnba_ics", "hnba_ics_scraper", "HNBAICSScraper", {}),
        ("lgbtbarny", "lgbtbarny_scraper", "LGBTBarNYScraper", {}),
        ("wbasny", "wbasny_scraper", "WBASNYScraper", {}),
        ("nawl", "nawl_scraper", "NAWLScraper", {}),
        ("fedbar_ics", "fedbar_ics_scraper", "FBAICSScraper", {}),
        ("cuny_law_ics", "cuny_law_ics_scraper", "CUNYLawICSScraper", {}),
        ("chips_network", "chips_network_scraper", "ChIPsNetworkScraper", {}),
        ("nycbar", "nycbar_scraper", "NYCBarScraper", {"community_id": "com_nycbar"}),
        ("fordham", "fordham_scraper", "FordhamScraper", {"community_id": "com_fordham"}),
        ("lawyers_alliance", "lawyers_alliance_scraper", "LawyersAllianceScraper", {"community_id": "com_lawyers_alliance"}),
        ("nyiac", "nyiac_scraper", "NYIACScraper", {"community_id": "com_nyiac"}),
        ("ics_calendar", "ics_calendar_scraper", "ICSCalendarScraper", {"community_id": "com_ics_calendar"}),
    ]
    
    results = {}
    total_events = 0
    successful_scrapers = 0
    
    print(f"🚀 Starting local scraper run at {datetime.now(timezone.utc).isoformat()}")
    print("=" * 80)
    
    # Ensure data directory exists
    data_dir = os.path.join(os.path.dirname(__file__), 'data')
    os.makedirs(data_dir, exist_ok=True)
    
    for name, module_name, class_name, kwargs in scraper_configs:
        try:
            print(f"\n📊 Running {name} scraper...")
            
            # Import and instantiate scraper
            module = __import__(module_name, fromlist=[class_name])
            scraper_class = getattr(module, class_name)
            scraper = scraper_class(**kwargs)
            
            # Run scraper
            events = scraper.get_events()
            
            if events:
                print(f"✅ {name}: Found {len(events)} events")
                
                # Convert events to serializable format
                events_data = []
                for event in events:
                    event_dict = event.to_dict()
                    # Add scraper metadata
                    event_dict['scraper_name'] = name
                    event_dict['scraped_at'] = datetime.now(timezone.utc).isoformat()
                    events_data.append(event_dict)
                
                # Save to JSON file
                output_file = os.path.join(data_dir, f"{name}_events.json")
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump({
                        'scraper_name': name,
                        'scraped_at': datetime.now(timezone.utc).isoformat(),
                        'total_events': len(events),
                        'events': events_data
                    }, f, indent=2, ensure_ascii=False, default=str)
                
                print(f"💾 Saved {len(events)} events to {output_file}")
                
                results[name] = {
                    'success': True,
                    'event_count': len(events),
                    'output_file': output_file
                }
                total_events += len(events)
                successful_scrapers += 1
                
                # Show sample event with categorization
                if events:
                    sample_event = events[0]
                    print(f"📋 Sample event: \"{sample_event.name[:60]}{'...' if len(sample_event.name) > 60 else ''}\"")
                    print(f"   → Categories: {sample_event.category[:3] if sample_event.category else []}")
                    print(f"   → Event Type: {sample_event.event_type}")
                    print(f"   → CLE Credits: {sample_event.cle_credits}")
                
            else:
                print(f"⚠️  {name}: No events found")
                results[name] = {
                    'success': True,
                    'event_count': 0,
                    'output_file': None
                }
                
        except Exception as e:
            print(f"❌ {name}: Error - {e}")
            results[name] = {
                'success': False,
                'error': str(e),
                'event_count': 0,
                'output_file': None
            }
    
    # Create summary file
    summary_file = os.path.join(data_dir, f"scraper_run_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
    summary = {
        'run_timestamp': datetime.now(timezone.utc).isoformat(),
        'total_scrapers': len(scraper_configs),
        'successful_scrapers': successful_scrapers,
        'total_events': total_events,
        'results': results
    }
    
    with open(summary_file, 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2, ensure_ascii=False, default=str)
    
    print("\n" + "=" * 80)
    print(f"🎉 Scraper run completed!")
    print(f"📊 Summary:")
    print(f"   • Total scrapers: {len(scraper_configs)}")
    print(f"   • Successful: {successful_scrapers}")
    print(f"   • Total events: {total_events}")
    print(f"   • Summary saved to: {summary_file}")
    print(f"   • Individual files saved to: {data_dir}/")
    
    # Show top performers
    successful_results = {k: v for k, v in results.items() if v['success'] and v['event_count'] > 0}
    if successful_results:
        print(f"\n🏆 Top performers:")
        sorted_results = sorted(successful_results.items(), key=lambda x: x[1]['event_count'], reverse=True)
        for name, result in sorted_results[:5]:
            print(f"   • {name}: {result['event_count']} events")
    
    return summary

if __name__ == "__main__":
    try:
        summary = run_all_scrapers()
        print(f"\n✅ All done! Check the data/ directory for results.")
    except Exception as e:
        print(f"❌ Fatal error: {e}")
        sys.exit(1) 