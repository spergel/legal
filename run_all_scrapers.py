#!/usr/bin/env python3
"""
Master scraper runner that executes all scrapers and combines their data
"""

import os
import json
import logging
import subprocess
import sys
from datetime import datetime, timezone
from typing import List, Dict, Any
import importlib.util

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

SCRAPERS_DIR = "scrapers"

def get_all_scraper_files() -> List[str]:
    """Get all scraper Python files that have main execution blocks."""
    scraper_files = []

    # List all Python files in scrapers directory
    for filename in os.listdir(SCRAPERS_DIR):
        if filename.endswith('.py') and filename != '__init__.py' and filename != 'models.py' and filename != 'base_scraper.py':
            filepath = os.path.join(SCRAPERS_DIR, filename)
            try:
                # Check if file has if __name__ == "__main__" block
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if 'if __name__ == "__main__":' in content:
                        scraper_files.append(filename)
            except Exception as e:
                logger.warning(f"Could not read {filename}: {e}")

    return scraper_files

def run_scraper(scraper_file: str) -> Dict[str, Any]:
    """Run a single scraper and return its results."""
    scraper_name = scraper_file.replace('.py', '')
    logger.info(f"🚀 Running scraper: {scraper_name}")

    try:
        # Set up environment for running the scraper
        original_cwd = os.getcwd()
        env = os.environ.copy()
        env['PYTHONPATH'] = os.path.abspath(SCRAPERS_DIR)

        # Run the scraper from the project root to ensure imports work
        result = subprocess.run(
            [sys.executable, os.path.join(SCRAPERS_DIR, scraper_file)],
            capture_output=True,
            text=True,
            timeout=300,  # 5 minute timeout
            env=env,
            cwd=original_cwd  # Run from project root
        )

        if result.returncode == 0:
            logger.info(f"✅ {scraper_name} completed successfully")

            # Try to find the output file
            output_file = find_scraper_output(scraper_name)
            if output_file:
                return {
                    'scraper': scraper_name,
                    'status': 'success',
                    'output_file': output_file,
                    'stdout': result.stdout
                }
            else:
                return {
                    'scraper': scraper_name,
                    'status': 'success',
                    'output_file': None,
                    'stdout': result.stdout
                }
        else:
            logger.error(f"❌ {scraper_name} failed: {result.stderr}")
            return {
                'scraper': scraper_name,
                'status': 'failed',
                'error': result.stderr,
                'stdout': result.stdout
            }

    except subprocess.TimeoutExpired:
        logger.error(f"⏰ {scraper_name} timed out")
        return {
            'scraper': scraper_name,
            'status': 'timeout',
            'error': 'Scraper timed out after 5 minutes'
        }
    except Exception as e:
        logger.error(f"💥 {scraper_name} error: {e}")
        return {
            'scraper': scraper_name,
            'status': 'error',
            'error': str(e)
        }

def find_scraper_output(scraper_name: str) -> str:
    """Find the most recent output file for a scraper."""
    data_dir = os.path.join(SCRAPERS_DIR, "data")

    if not os.path.exists(data_dir):
        return None

    # Look for files matching the scraper name pattern
    files = [f for f in os.listdir(data_dir) if f.startswith(scraper_name) and f.endswith('.json')]

    if not files:
        return None

    # Sort by modification time (newest first)
    files.sort(key=lambda x: os.path.getmtime(os.path.join(data_dir, x)), reverse=True)
    return os.path.join(data_dir, files[0])

def combine_scraper_results(results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Combine all successful scraper results into a single events file."""
    logger.info("🔄 Combining scraper results...")

    all_events = []
    successful_scrapers = 0

    for result in results:
        if result['status'] == 'success' and result.get('output_file'):
            try:
                with open(result['output_file'], 'r', encoding='utf-8') as f:
                    events = json.load(f)
                    all_events.extend(events)
                    successful_scrapers += 1
                    logger.info(f"📊 Added {len(events)} events from {result['scraper']}")
            except Exception as e:
                logger.error(f"Error reading {result['output_file']}: {e}")

    # Create combined result
    combined_data = {
        'metadata': {
            'generated_at': datetime.now(timezone.utc).isoformat(),
            'total_events': len(all_events),
            'successful_scrapers': successful_scrapers,
            'total_scrapers': len(results)
        },
        'events': all_events
    }

    # Save combined data
    output_file = 'all_events_combined.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(combined_data, f, indent=2, ensure_ascii=False)

    logger.info(f"✅ Combined {len(all_events)} events from {successful_scrapers} scrapers")
    return combined_data

def main():
    """Main function to run all scrapers."""
    print("🚀 Legal Events Scraper Runner")
    print("=" * 50)

    # Get all scraper files
    scraper_files = get_all_scraper_files()
    logger.info(f"Found {len(scraper_files)} scrapers to run")

    if not scraper_files:
        logger.error("No scrapers found!")
        return False

    # Run all scrapers
    results = []
    for scraper_file in scraper_files:
        result = run_scraper(scraper_file)
        results.append(result)

    # Combine results
    combined_data = combine_scraper_results(results)

    # Print summary
    print("\n📊 SCRAPER RUN SUMMARY")
    print("=" * 30)
    print(f"Total scrapers: {len(results)}")
    print(f"Successful: {len([r for r in results if r['status'] == 'success'])}")
    print(f"Failed: {len([r for r in results if r['status'] != 'success'])}")
    print(f"Total events: {combined_data['metadata']['total_events']}")

    # Show failures
    failures = [r for r in results if r['status'] != 'success']
    if failures:
        print("\n❌ FAILED SCRAPERS:")
        for failure in failures:
            print(f"  - {failure['scraper']}: {failure['status']}")

    print(f"\n✅ Combined data saved to: all_events_combined.json")

    return len([r for r in results if r['status'] == 'success']) > 0

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
