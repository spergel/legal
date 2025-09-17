import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.json();
    
    // Validate required fields
    if (!formData.name || !formData.description || !formData.startDate) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, and startDate are required' },
        { status: 400 }
      );
    }

    // Parse dates
    const startDate = new Date(formData.startDate);
    const endDate = formData.endDate ? new Date(formData.endDate) : startDate;

    // Validate dates
    if (isNaN(startDate.getTime())) {
      return NextResponse.json({ error: 'Invalid start date' }, { status: 400 });
    }
    if (formData.endDate && isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Invalid end date' }, { status: 400 });
    }

    // Map form data to database schema
    const eventData = {
      name: formData.name,
      description: formData.description,
      startDate: startDate,
      endDate: endDate,
      locationName: formData.location || 'Online/TBD',
      url: formData.url || null,
      cleCredits: formData.cleCredits ? parseInt(formData.cleCredits) : null,
      status: 'PENDING' as const,
      submittedBy: session.user.email,
      submittedAt: new Date(),
      updatedAt: new Date(),
      notes: formData.notes || null,
    };

    // Create the event in the database
    const event = await prisma.event.create({
      data: eventData
    });

    return NextResponse.json({ 
      success: true, 
      event: {
        ...event,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate.toISOString(),
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
      }
    });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
} 