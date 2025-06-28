import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { cleanupOldEvents, getCleanupStats } from '@/lib/data-loader';
import { PrismaClient } from '@prisma/client';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
const prisma = new PrismaClient();

// For security, require a secret token
const SCRAPER_SECRET = process.env.SCRAPER_SECRET;

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !ADMIN_EMAILS.includes(session.user?.email as string)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const stats = await getCleanupStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error getting cleanup stats:', error);
    return NextResponse.json({ error: 'Failed to get cleanup stats' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { secret, operations } = await req.json();
    
    if (!SCRAPER_SECRET || secret !== SCRAPER_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = {
      deletedPastEvents: 0,
      deletedCancelledEvents: 0,
      archivedDeniedEvents: 0,
      deletedCorruptedEvents: 0,
      errors: [] as string[]
    };

    // Default to running all operations if none specified
    const opsToRun = operations || ['past', 'cancelled', 'denied', 'corrupted'];

    try {
      // 1. Delete events that ended more than 1 day ago
      if (opsToRun.includes('past')) {
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        
        const pastEventsResult = await prisma.event.deleteMany({
          where: {
            endDate: {
              lt: oneDayAgo
            },
            status: {
              in: ['APPROVED', 'FEATURED', 'PENDING']
            }
          }
        });
        
        results.deletedPastEvents = pastEventsResult.count;
      }

      // 2. Delete cancelled events that were cancelled more than 1 day ago
      if (opsToRun.includes('cancelled')) {
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        
        const cancelledEventsResult = await prisma.event.deleteMany({
          where: {
            status: 'CANCELLED',
            updatedAt: {
              lt: oneDayAgo
            }
          }
        });
        
        results.deletedCancelledEvents = cancelledEventsResult.count;
      }

      // 3. Archive denied events that are more than 1 week old
      if (opsToRun.includes('denied')) {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const deniedEventsResult = await prisma.event.updateMany({
          where: {
            status: 'DENIED',
            updatedAt: {
              lt: oneWeekAgo
            }
          },
          data: {
            status: 'ARCHIVED',
            updatedAt: new Date(),
            updatedBy: 'system@cleanup-api',
            notes: 'Auto-archived old denied event via API cleanup'
          }
        });
        
        results.archivedDeniedEvents = deniedEventsResult.count;
      }

      // 4. Delete events with corrupted timestamps (the specific clustering issue)
      if (opsToRun.includes('corrupted')) {
        const corruptedEventsResult = await prisma.event.deleteMany({
          where: {
            startDate: {
              gte: new Date('2025-07-22T16:14:00.000Z'),
              lte: new Date('2025-07-22T16:15:00.000Z')
            }
          }
        });
        
        results.deletedCorruptedEvents = corruptedEventsResult.count;
      }

      return NextResponse.json({
        message: 'Cleanup completed successfully',
        ...results
      });

    } catch (cleanupError) {
      const errorMessage = cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
      results.errors.push(`Cleanup operation failed: ${errorMessage}`);
      
      return NextResponse.json({
        message: 'Cleanup completed with errors',
        ...results
      }, { status: 207 }); // 207 Multi-Status for partial success
    }

  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 