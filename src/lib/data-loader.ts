'use server';

import { PrismaClient } from '@prisma/client';
import { Event, Location, Community, EventStatus } from '@/types';

const prisma = new PrismaClient();

// Helper function to check if an event is upcoming
function isUpcomingEvent(event: Event): boolean {
  const now = new Date();
  const eventDate = new Date(event.startDate);
  return eventDate >= now;
}

// Helper function to sanitize event data
function sanitizeEvent(event: any): Event {
  return {
    ...event,
    // Ensure required fields have default values
    name: event.name || 'Untitled Event',
    description: event.description || 'No description available',
    locationName: event.locationName || 'Location TBD',
    startDate: event.startDate || new Date(),
    endDate: event.endDate || event.startDate || new Date(),
    submittedAt: event.submittedAt || new Date(),
    updatedAt: event.updatedAt || new Date(),
    // Ensure optional fields are properly handled
    url: event.url || null,
    cleCredits: event.cleCredits || null,
    externalId: event.externalId || null,
    submittedBy: event.submittedBy || 'Unknown',
    updatedBy: event.updatedBy || null,
    notes: event.notes || null,
    locationId: event.locationId || null,
    location: event.location || null,
    communityId: event.communityId || null,
    community: event.community || null,
    tags: event.tags || null,
    image: event.image || null,
    metadata: event.metadata || null,
    price: event.price || null,
    category: event.category || null,
  };
}

export async function getAllEvents(): Promise<Event[]> {
  try {
    console.log('Fetching events from database...');
    const events = await prisma.event.findMany({
      where: {
        status: {
          in: ['APPROVED', 'FEATURED']
        }
      },
      orderBy: {
        startDate: 'asc'
      },
      include: {
        location: true,
        community: true
      }
    });
    
    console.log(`Found ${events.length} events in database`);
    
    // Sanitize and filter events
    const sanitizedEvents = events
      .map(sanitizeEvent)
      .filter(isUpcomingEvent);
    
    console.log(`${sanitizedEvents.length} events are upcoming`);
    return sanitizedEvents;
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

export async function getAllEventsForAdmin(): Promise<Event[]> {
  try {
    const events = await prisma.event.findMany({
      orderBy: {
        startDate: 'asc'
      },
      include: {
        location: true,
        community: true
      }
    });
    
    return events.map(sanitizeEvent);
  } catch (error) {
    console.error('Error fetching events for admin:', error);
    return [];
  }
}

export async function getEventById(id: string): Promise<Event | null> {
  try {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        location: true,
        community: true
      }
    });
    
    return event ? sanitizeEvent(event) : null;
  } catch (error) {
    console.error('Error fetching event by ID:', error);
    return null;
  }
}

export async function getPendingEvents(): Promise<Event[]> {
  try {
    const events = await prisma.event.findMany({
      where: {
        status: 'PENDING'
      },
      orderBy: {
        submittedAt: 'desc'
      },
      include: {
        location: true,
        community: true
      }
    });
    
    return events.map(sanitizeEvent);
  } catch (error) {
    console.error('Error fetching pending events:', error);
    return [];
  }
}

export async function updateEventStatus(
  eventId: string, 
  status: EventStatus, 
  updatedBy: string,
  notes?: string
): Promise<Event> {
  try {
    const event = await prisma.event.update({
      where: { id: eventId },
      data: {
        status: { set: status },
        updatedBy,
        notes,
        updatedAt: new Date()
      },
      include: {
        location: true,
        community: true
      }
    });
    
    return sanitizeEvent(event);
  } catch (error) {
    console.error('Error updating event status:', error);
    throw error;
  }
}

export async function getAllLocations(): Promise<Location[]> {
  try {
    return await prisma.location.findMany({
      orderBy: {
        name: 'asc'
      }
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return [];
  }
}

export async function getLocationById(id: string): Promise<Location | null> {
  try {
    return await prisma.location.findUnique({
      where: { id }
    });
  } catch (error) {
    console.error('Error fetching location by ID:', error);
    return null;
  }
}

export async function getAllCommunities(): Promise<Community[]> {
  try {
    return await prisma.community.findMany({
      orderBy: {
        name: 'asc'
      }
    });
  } catch (error) {
    console.error('Error fetching communities:', error);
    return [];
  }
}

export async function getCommunityById(id: string): Promise<Community | null> {
  try {
    return await prisma.community.findUnique({
      where: { id }
    });
  } catch (error) {
    console.error('Error fetching community by ID:', error);
    return null;
  }
}

// Helper function to format date strings
export async function formatDate(dateString: string): Promise<string> {
  try {
    if (!dateString) {
      return 'Date not available';
    }
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  } catch (error) {
    console.warn(`Invalid date string for formatting: ${dateString}`);
    return 'Date not available';
  }
} 