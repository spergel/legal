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

// Helper function to deduplicate events using the same logic as cleanup API
function deduplicateEvents(events: Event[]): Event[] {
  const eventGroups = new Map();
  
  for (const event of events) {
    // Use externalId if available, otherwise use name+startDate
    const key = event.externalId || `${event.name}-${new Date(event.startDate).toISOString()}`;
    
    if (!eventGroups.has(key)) {
      eventGroups.set(key, []);
    }
    eventGroups.get(key)!.push(event);
  }
  
  // For each group, keep the event with the earliest submittedAt
  const deduplicatedEvents: Event[] = [];
  for (const [key, groupEvents] of eventGroups) {
    if (groupEvents.length === 1) {
      deduplicatedEvents.push(groupEvents[0]);
    } else {
      // Sort by submittedAt and keep the oldest
      groupEvents.sort((a: Event, b: Event) => 
        new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
      );
      deduplicatedEvents.push(groupEvents[0]);
    }
  }
  
  return deduplicatedEvents;
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
    
    // Updated categorization fields with proper defaults
    category: Array.isArray(event.category) ? event.category : [],
    tags: Array.isArray(event.tags) ? event.tags : [],
    eventType: event.eventType || null,
    image: event.image || null,
    price: event.price || null,
    metadata: event.metadata || null,
  };
}

export async function getAllEvents(): Promise<Event[]> {
  try {
    console.log('🔍 [getAllEvents] Starting event fetch...');
    console.log('🔍 [getAllEvents] DATABASE_URL exists:', !!process.env.DATABASE_URL);

    console.log('🔍 [getAllEvents] Connecting to database...');
    // Test connection
    await prisma.$connect();
    console.log('✅ [getAllEvents] Database connection successful');

    console.log('🔍 [getAllEvents] Executing query for APPROVED/FEATURED events...');
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

    console.log(`📊 [getAllEvents] Raw query returned ${events.length} events`);
    console.log('🔍 [getAllEvents] Sample events:', events.slice(0, 3).map(e => ({
      id: e.id,
      name: e.name,
      status: e.status,
      startDate: e.startDate
    })));

    // Sanitize, filter, and deduplicate events
    console.log('🔍 [getAllEvents] Sanitizing events...');
    const sanitizedEvents = events.map(sanitizeEvent);

    console.log('🔍 [getAllEvents] Filtering for upcoming events...');
    const upcomingEvents = sanitizedEvents.filter(isUpcomingEvent);

    console.log(`📊 [getAllEvents] ${sanitizedEvents.length} total sanitized, ${upcomingEvents.length} upcoming`);

    console.log('🔍 [getAllEvents] Deduplicating events...');
    const deduplicatedEvents = deduplicateEvents(upcomingEvents);

    console.log(`✅ [getAllEvents] Final result: ${deduplicatedEvents.length} events`);
    console.log('🔍 [getAllEvents] Sample final events:', deduplicatedEvents.slice(0, 2).map(e => ({
      id: e.id,
      name: e.name,
      status: e.status,
      startDate: e.startDate
    })));

    await prisma.$disconnect();
    return deduplicatedEvents;
  } catch (error) {
    console.error('❌ [getAllEvents] Error fetching events:', error);
    console.error('❌ [getAllEvents] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
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
    const communities = await prisma.community.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    
    // Transform to ensure category is always an array
    return communities.map(community => ({
      ...community,
      category: Array.isArray(community.category) ? community.category : []
    }));
  } catch (error) {
    console.error('Error fetching communities:', error);
    return [];
  }
}

export async function getCommunityById(id: string): Promise<Community | null> {
  try {
    const community = await prisma.community.findUnique({
      where: { id }
    });
    
    if (!community) {
      return null;
    }
    
    // Transform to ensure category is always an array
    return {
      ...community,
      category: Array.isArray(community.category) ? community.category : []
    };
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

// Cleanup function to delete old events
export async function cleanupOldEvents(): Promise<{ deleted: number; errors: string[] }> {
  const errors: string[] = [];
  let deleted = 0;
  
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    // Delete events that ended more than a day ago
    const pastEventsResult = await prisma.event.deleteMany({
      where: {
        endDate: {
          lt: oneDayAgo
        },
        status: {
          in: ['APPROVED', 'FEATURED', 'PENDING'] // Don't delete denied/archived events immediately
        }
      }
    });
    
    deleted += pastEventsResult.count;
    console.log(`Deleted ${pastEventsResult.count} past events`);
    
    // Delete cancelled events that were cancelled more than a day ago
    const cancelledEventsResult = await prisma.event.deleteMany({
      where: {
        status: 'CANCELLED',
        updatedAt: {
          lt: oneDayAgo
        }
      }
    });
    
    deleted += cancelledEventsResult.count;
    console.log(`Deleted ${cancelledEventsResult.count} old cancelled events`);
    
    // Optionally, archive denied events that are more than a week old instead of deleting them
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
        updatedBy: 'system@cleanup',
        notes: 'Auto-archived old denied event'
      }
    });
    
    console.log(`Archived ${deniedEventsResult.count} old denied events`);
    
  } catch (error) {
    console.error('Error during cleanup:', error);
    errors.push(`Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  return { deleted, errors };
}

// Function to get cleanup statistics
export async function getCleanupStats(): Promise<{
  pastEvents: number;
  oldCancelledEvents: number;
  oldDeniedEvents: number;
}> {
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const [pastEvents, oldCancelledEvents, oldDeniedEvents] = await Promise.all([
      prisma.event.count({
        where: {
          endDate: {
            lt: oneDayAgo
          },
          status: {
            in: ['APPROVED', 'FEATURED', 'PENDING']
          }
        }
      }),
      prisma.event.count({
        where: {
          status: 'CANCELLED',
          updatedAt: {
            lt: oneDayAgo
          }
        }
      }),
      prisma.event.count({
        where: {
          status: 'DENIED',
          updatedAt: {
            lt: oneWeekAgo
          }
        }
      })
    ]);
    
    return {
      pastEvents,
      oldCancelledEvents,
      oldDeniedEvents
    };
  } catch (error) {
    console.error('Error getting cleanup stats:', error);
    return {
      pastEvents: 0,
      oldCancelledEvents: 0,
      oldDeniedEvents: 0
    };
  }
} 