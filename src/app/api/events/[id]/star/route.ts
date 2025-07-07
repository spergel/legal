import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

// Create a singleton Prisma instance to avoid connection overhead
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const eventId = params.id;
    
    // Get user and check if already starred in a single query
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        starredEvents: {
          where: { eventId: eventId },
          take: 1
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isAlreadyStarred = user.starredEvents.length > 0;

    if (isAlreadyStarred) {
      // Unstar the event
      await prisma.userEvent.delete({
        where: {
          userId_eventId: {
            userId: user.id,
            eventId: eventId
          }
        }
      });

      return NextResponse.json({ starred: false });
    } else {
      // Star the event - use upsert to handle race conditions
      await prisma.userEvent.upsert({
        where: {
          userId_eventId: {
            userId: user.id,
            eventId: eventId
          }
        },
        update: {},
        create: {
          userId: user.id,
          eventId: eventId
        }
      });

      return NextResponse.json({ starred: true });
    }
  } catch (error) {
    console.error('Error toggling star:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ starred: false });
  }

  try {
    const eventId = params.id;
    
    // Get user and check star status in a single query
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        starredEvents: {
          where: { eventId: eventId },
          take: 1
        }
      }
    });

    if (!user) {
      return NextResponse.json({ starred: false });
    }

    return NextResponse.json({ starred: user.starredEvents.length > 0 });
  } catch (error) {
    console.error('Error checking star status:', error);
    return NextResponse.json({ starred: false });
  }
} 