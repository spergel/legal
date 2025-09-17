import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  return NextResponse.json({ 
    error: 'Starred events functionality temporarily disabled during schema simplification',
    events: [] 
  }, { status: 501 });
  /*
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ events: [] });
  }

  try {
    // Get user ID from email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ events: [] });
    }

    // Get starred events
    const starredEvents = await prisma.userEvent.findMany({
      where: { userId: user.id },
      include: {
        event: {
          include: {
            location: true,
            community: true,
          }
        }
      },
      orderBy: {
        starredAt: 'desc'
      }
    });

    // Format the response
    const events = starredEvents.map(userEvent => ({
      ...userEvent.event,
      startDate: userEvent.event.startDate.toISOString(),
      endDate: userEvent.event.endDate.toISOString(),
      submittedAt: userEvent.event.submittedAt.toISOString(),
      updatedAt: userEvent.event.updatedAt.toISOString(),
      starredAt: userEvent.starredAt.toISOString(),
    }));

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching starred events:', error);
    return NextResponse.json({ events: [] });
  }
  */
} 