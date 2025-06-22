import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { cleanupOldEvents, getCleanupStats } from '@/lib/data-loader';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

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

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !ADMIN_EMAILS.includes(session.user?.email as string)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await cleanupOldEvents();
    
    if (result.errors.length > 0) {
      return NextResponse.json({ 
        success: false, 
        deleted: result.deleted, 
        errors: result.errors 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      deleted: result.deleted,
      message: `Successfully cleaned up ${result.deleted} events`
    });
  } catch (error) {
    console.error('Error during cleanup:', error);
    return NextResponse.json({ 
      error: 'Failed to perform cleanup',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 