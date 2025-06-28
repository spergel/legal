#!/usr/bin/env python3
"""
API-based Event Cleanup Script

This script calls the cleanup API endpoint to perform database maintenance.
This replaces the direct database cleanup scripts and provides a unified interface.
"""

import os
import sys
import requests
import json
from typing import Optional, List

def cleanup_via_api(
    api_url: Optional[str] = None,
    secret: Optional[str] = None,
    operations: Optional[List[str]] = None
) -> bool:
    """
    Call the cleanup API endpoint to perform database maintenance.
    
    Args:
        api_url: Base URL for the API (defaults to VERCEL_URL env var)
        secret: Secret for authentication (defaults to SCRAPER_SECRET env var)
        operations: List of operations to perform (defaults to all: ['past', 'cancelled', 'denied', 'corrupted'])
    
    Returns:
        True if successful, False otherwise
    """
    
    # Get configuration from environment or parameters
    if not api_url:
        api_url = os.environ.get("VERCEL_URL")
        if api_url and not api_url.startswith("http"):
            api_url = f"https://{api_url}"
    
    if not secret:
        secret = os.environ.get("SCRAPER_SECRET")
    
    if not api_url:
        print("❌ Error: API URL not provided. Set VERCEL_URL environment variable or pass api_url parameter.")
        return False
        
    if not secret:
        print("❌ Error: Secret not provided. Set SCRAPER_SECRET environment variable or pass secret parameter.")
        return False
    
    # Prepare API endpoint and payload
    cleanup_url = f"{api_url.rstrip('/')}/api/admin/cleanup"
    payload = {"secret": secret}
    
    if operations:
        payload["operations"] = operations
    
    print(f"🔄 Calling cleanup API: {cleanup_url}")
    if operations:
        print(f"📋 Operations: {', '.join(operations)}")
    else:
        print("📋 Operations: all (past, cancelled, denied, corrupted)")
    
    try:
        response = requests.post(
            cleanup_url,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Cleanup completed successfully!")
            print(f"   Deleted past events: {result.get('deletedPastEvents', 0)}")
            print(f"   Deleted cancelled events: {result.get('deletedCancelledEvents', 0)}")
            print(f"   Archived denied events: {result.get('archivedDeniedEvents', 0)}")
            print(f"   Deleted corrupted events: {result.get('deletedCorruptedEvents', 0)}")
            
            if result.get('errors'):
                print("⚠️  Errors occurred:")
                for error in result['errors']:
                    print(f"   - {error}")
            
            return True
            
        elif response.status_code == 207:
            result = response.json()
            print("⚠️  Cleanup completed with errors!")
            print(f"   Deleted past events: {result.get('deletedPastEvents', 0)}")
            print(f"   Deleted cancelled events: {result.get('deletedCancelledEvents', 0)}")
            print(f"   Archived denied events: {result.get('archivedDeniedEvents', 0)}")
            print(f"   Deleted corrupted events: {result.get('deletedCorruptedEvents', 0)}")
            
            if result.get('errors'):
                print("❌ Errors:")
                for error in result['errors']:
                    print(f"   - {error}")
            
            return False
            
        else:
            print(f"❌ API call failed with status {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Error: {error_data.get('error', 'Unknown error')}")
            except:
                print(f"   Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error calling cleanup API: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def main():
    """Main function for command line usage"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Clean up events via API")
    parser.add_argument('--url', help='API base URL (default: VERCEL_URL env var)')
    parser.add_argument('--secret', help='Authentication secret (default: SCRAPER_SECRET env var)')
    parser.add_argument('--operations', nargs='+', 
                       choices=['past', 'cancelled', 'denied', 'corrupted'],
                       help='Specific cleanup operations to run (default: all)')
    
    args = parser.parse_args()
    
    success = cleanup_via_api(
        api_url=args.url,
        secret=args.secret,
        operations=args.operations
    )
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main() 