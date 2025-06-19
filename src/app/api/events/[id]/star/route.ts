import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    
    // Get user ID from email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if already starred
    const existingStar = await prisma.userEvent.findUnique({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId: eventId
        }
      }
    });

    if (existingStar) {
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
      // Star the event
      await prisma.userEvent.create({
        data: {
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
    
    // Get user ID from email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ starred: false });
    }

    // Check if event is starred
    const existingStar = await prisma.userEvent.findUnique({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId: eventId
        }
      }
    });

    return NextResponse.json({ starred: !!existingStar });
  } catch (error) {
    console.error('Error checking star status:', error);
    return NextResponse.json({ starred: false });
  }
} 