#!/usr/bin/env python3
"""
Event Cleanup Script

This script can be run as part of the scraper workflow to automatically clean up old events.

The script will:
- Delete events that ended more than 1 day ago
- Delete cancelled events that were cancelled more than 1 day ago
- Archive denied events that are more than 1 week old
"""

import os
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Tuple
import logging

# Add the parent directory to the path so we can import from scrapers
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from prisma import Prisma
except ImportError:
    print("❌ Prisma Python client not found. Please install it with: pip install prisma")
    sys.exit(1)

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class EventCleanup:
    def __init__(self):
        self.prisma = Prisma()
        self.deleted_count = 0
        self.archived_count = 0
        self.errors = []
        
    async def connect(self):
        """Connect to the database"""
        try:
            await self.prisma.connect()
            logger.info("✅ Connected to database")
        except Exception as e:
            logger.error(f"❌ Failed to connect to database: {e}")
            raise
    
    async def disconnect(self):
        """Disconnect from the database"""
        try:
            await self.prisma.disconnect()
            logger.info("✅ Disconnected from database")
        except Exception as e:
            logger.error(f"❌ Error disconnecting from database: {e}")
    
    async def cleanup_old_events(self) -> Tuple[int, int, List[str]]:
        """Main cleanup function"""
        logger.info("🔄 Starting event cleanup...")
        logger.info(f"📅 Current time: {datetime.now().isoformat()}")
        
        try:
            # Calculate time thresholds
            one_day_ago = datetime.now() - timedelta(days=1)
            one_week_ago = datetime.now() - timedelta(days=7)
            
            # Delete events that ended more than a day ago
            past_events_result = await self.prisma.event.delete_many(
                where={
                    'endDate': {
                        'lt': one_day_ago
                    },
                    'status': {
                        'in': ['APPROVED', 'FEATURED', 'PENDING']
                    }
                }
            )
            
            self.deleted_count += past_events_result
            logger.info(f"✅ Deleted {past_events_result} past events")
            
            # Delete cancelled events that were cancelled more than a day ago
            cancelled_events_result = await self.prisma.event.delete_many(
                where={
                    'status': 'CANCELLED',
                    'updatedAt': {
                        'lt': one_day_ago
                    }
                }
            )
            
            self.deleted_count += cancelled_events_result
            logger.info(f"✅ Deleted {cancelled_events_result} old cancelled events")
            
            # Archive denied events that are more than a week old
            denied_events_result = await self.prisma.event.update_many(
                where={
                    'status': 'DENIED',
                    'updatedAt': {
                        'lt': one_week_ago
                    }
                },
                data={
                    'status': 'ARCHIVED',
                    'updatedAt': datetime.now(),
                    'updatedBy': 'system@cleanup-python',
                    'notes': 'Auto-archived old denied event via Python cleanup script'
                }
            )
            
            self.archived_count += denied_events_result
            logger.info(f"📦 Archived {denied_events_result} old denied events")
            
            # Get cleanup statistics
            stats = await self.get_cleanup_stats()
            logger.info("\n📊 Current cleanup statistics:")
            logger.info(f"   Past events: {stats['pastEvents']}")
            logger.info(f"   Old cancelled events: {stats['oldCancelledEvents']}")
            logger.info(f"   Old denied events: {stats['oldDeniedEvents']}")
            
            logger.info(f"\n🎉 Cleanup completed successfully!")
            logger.info(f"   Deleted: {self.deleted_count} events")
            logger.info(f"   Archived: {self.archived_count} events")
            
        except Exception as e:
            error_msg = f"Cleanup failed: {str(e)}"
            logger.error(f"❌ {error_msg}")
            self.errors.append(error_msg)
        
        return self.deleted_count, self.archived_count, self.errors
    
    async def get_cleanup_stats(self) -> Dict[str, int]:
        """Get statistics about events that can be cleaned up"""
        try:
            one_day_ago = datetime.now() - timedelta(days=1)
            one_week_ago = datetime.now() - timedelta(days=7)
            
            # Get counts for different types of events that can be cleaned up
            past_events = await self.prisma.event.count(
                where={
                    'endDate': {
                        'lt': one_day_ago
                    },
                    'status': {
                        'in': ['APPROVED', 'FEATURED', 'PENDING']
                    }
                }
            )
            
            old_cancelled_events = await self.prisma.event.count(
                where={
                    'status': 'CANCELLED',
                    'updatedAt': {
                        'lt': one_day_ago
                    }
                }
            )
            
            old_denied_events = await self.prisma.event.count(
                where={
                    'status': 'DENIED',
                    'updatedAt': {
                        'lt': one_week_ago
                    }
                }
            )
            
            return {
                'pastEvents': past_events,
                'oldCancelledEvents': old_cancelled_events,
                'oldDeniedEvents': old_denied_events
            }
            
        except Exception as e:
            logger.error(f"Error getting cleanup stats: {e}")
            return {
                'pastEvents': 0,
                'oldCancelledEvents': 0,
                'oldDeniedEvents': 0
            }

async def main():
    """Main function to run the cleanup"""
    cleanup = EventCleanup()
    
    try:
        await cleanup.connect()
        deleted, archived, errors = await cleanup.cleanup_old_events()
        
        if errors:
            logger.error("❌ Errors occurred during cleanup:")
            for error in errors:
                logger.error(f"   - {error}")
            sys.exit(1)
        
        logger.info("✅ Cleanup script finished successfully")
        
    except Exception as e:
        logger.error(f"💥 Script execution failed: {e}")
        sys.exit(1)
    finally:
        await cleanup.disconnect()

if __name__ == "__main__":
    import asyncio
    asyncio.run(main()) 