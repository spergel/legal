# Event Cleanup System

This directory contains scripts and functionality for cleaning up old events from the database.

## Overview

The cleanup system removes or archives events that are no longer relevant:

- **Past Events**: Events that ended more than 1 day ago (deleted)
- **Old Cancelled Events**: Events cancelled more than 1 day ago (deleted)
- **Old Denied Events**: Events denied more than 1 week ago (archived)

## Automated Cleanup (Recommended)

**Primary Method**: The cleanup runs automatically as part of the GitHub Actions scraper workflow.

The cleanup is integrated into the daily scraper workflow at `.github/workflows/scraper.yml` and runs:
- Every day at 2 AM UTC
- After scraping new events
- Using Python (same environment as scrapers)

## Manual Script Execution

### Python Script: `scrapers/cleanup_events.py`
Python script for manual execution when needed.

**Usage:**
```bash
# Manual execution
cd scrapers
python cleanup_events.py

# Make executable and run directly
chmod +x scrapers/cleanup_events.py
./cleanup_events.py
```

**When to use:**
- One-time cleanup operations
- Testing cleanup functionality
- Server maintenance tasks
- When GitHub Actions is unavailable

## Admin Dashboard Integration

The cleanup functionality is also available through the admin dashboard:

1. Navigate to `/admin`
2. Click on the "Cleanup" tab
3. View statistics about events that can be cleaned up
4. Click "Run Cleanup" to manually trigger cleanup

## API Endpoints

### GET `/api/admin/cleanup`
Returns statistics about events that can be cleaned up.

**Response:**
```json
{
  "pastEvents": 5,
  "oldCancelledEvents": 2,
  "oldDeniedEvents": 1
}
```

### POST `/api/admin/cleanup`
Triggers the cleanup process.

**Response:**
```json
{
  "success": true,
  "deleted": 7,
  "message": "Successfully cleaned up 7 events"
}
```

## Safety Features

- **Confirmation Dialog**: Admin dashboard requires confirmation before cleanup
- **Selective Deletion**: Only deletes events with specific statuses
- **Archiving Instead of Deletion**: Denied events are archived rather than deleted
- **Error Handling**: Comprehensive error handling and logging
- **Statistics**: Shows exactly what will be cleaned up before execution

## Configuration

The cleanup thresholds can be modified in the following files:

- `scrapers/cleanup_events.py` - `cleanup_old_events()` method
- `src/lib/data-loader.ts` - `cleanupOldEvents()` function (for admin dashboard)

**Current Settings:**
- Past events: 1 day after end date
- Cancelled events: 1 day after cancellation
- Denied events: 1 week after denial (archived)

## Monitoring

The cleanup script provides detailed logging:

```bash
🔄 Starting event cleanup...
📅 Current time: 2025-01-20T02:00:00.000Z
✅ Deleted 3 past events
✅ Deleted 1 old cancelled events
📦 Archived 2 old denied events

📊 Current cleanup statistics:
   Past events: 0
   Old cancelled events: 0
   Old denied events: 0

🎉 Cleanup completed successfully!
   Deleted: 4 events
   Archived: 2 events
✅ Cleanup script finished successfully
```

## Dependencies

The Python cleanup script requires:
- `prisma==0.13.0` (added to `scrapers/requirements.txt`)
- Database connection via `DATABASE_URL` environment variable

## Best Practices

1. **Automated Workflow**: Primary method is the GitHub Actions workflow
2. **Review Before Manual Cleanup**: Always check statistics before running cleanup manually
3. **Monitor Regularly**: Check the admin dashboard periodically for cleanup statistics
4. **Backup Before Major Cleanup**: Consider backing up before large cleanup operations
5. **Test First**: Run the script manually before making changes 