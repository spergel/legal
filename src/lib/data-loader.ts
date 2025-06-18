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

export async function getAllEvents(): Promise<Event[]> {
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
  
  return events.filter(isUpcomingEvent);
}

export async function getAllEventsForAdmin(): Promise<Event[]> {
  const events = await prisma.event.findMany({
    orderBy: {
      startDate: 'asc'
    },
    include: {
      location: true,
      community: true
    }
  });
  
  return events;
}

export async function getEventById(id: string): Promise<Event | null> {
  return prisma.event.findUnique({
    where: { id },
    include: {
      location: true,
      community: true
    }
  });
}

export async function getPendingEvents(): Promise<Event[]> {
  return prisma.event.findMany({
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
}

export async function updateEventStatus(
  eventId: string, 
  status: EventStatus, 
  updatedBy: string,
  notes?: string
): Promise<Event> {
  return prisma.event.update({
    where: { id: eventId },
    data: {
      status: { set: status },
      updatedBy,
      notes,
      updatedAt: new Date()
    }
  });
}

export async function getAllLocations(): Promise<Location[]> {
  return prisma.location.findMany({
    orderBy: {
      name: 'asc'
    }
  });
}

export async function getLocationById(id: string): Promise<Location | null> {
  return prisma.location.findUnique({
    where: { id }
  });
}

export async function getAllCommunities(): Promise<Community[]> {
  return prisma.community.findMany({
    orderBy: {
      name: 'asc'
    }
  });
}

export async function getCommunityById(id: string): Promise<Community | null> {
  return prisma.community.findUnique({
    where: { id }
  });
}

// Helper function to format date strings
export async function formatDate(dateString: string): Promise<string> {
  try {
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