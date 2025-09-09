import { NextResponse } from 'next/server';
import { getAllEvents, getEventById } from '@/lib/data-loader';
import { Event } from '@/types';
import { prisma } from '@/lib/prisma';

function escapeICalText(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function eventToICS(event: Event) {
  const description = event.description ? escapeICalText(event.description) : '';
  
  // Convert dates to proper ICS format with timezone
  const startDate = new Date(event.startDate);
  const endDate = event.endDate ? new Date(event.endDate) : null;
  
  // Format dates in ICS format (YYYYMMDDTHHMMSSZ for UTC)
  const formatICSDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  };
  
  const dtstart = formatICSDate(startDate);
  const dtend = endDate ? formatICSDate(endDate) : null;
  
  // Get location information
  const location = event.location?.name || event.locationName || 'Location TBD';
  
  // Get community information for context
  const community = event.community?.name || '';
  const communityInfo = community ? `\n\nHosted by: ${community}` : '';
  
  // Enhanced description with community info
  const enhancedDescription = description + communityInfo;
  
  return `BEGIN:VEVENT
UID:${event.id}@eventcalendar
SUMMARY:${escapeICalText(event.name)}
DESCRIPTION:${escapeICalText(enhancedDescription)}
DTSTART:${dtstart}
${dtend ? `DTEND:${dtend}\n` : ''}URL:${event.url || ''}
LOCATION:${escapeICalText(location)}
STATUS:CONFIRMED
END:VEVENT`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId');
  const orgs = searchParams.get('orgs')?.split(',') || [];
  const ids = searchParams.get('ids')?.split(',') || [];
  const cleOnly = searchParams.get('cleOnly') === 'true';

  let ics: string;

  if (eventId) {
    const event = await getEventById(eventId);
    if (!event) {
      return new NextResponse('Event not found', { status: 404 });
    }
    ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Legal Events NYC//EN
CALSCALE:GREGORIAN
X-WR-CALNAME:Legal Events NYC
X-WR-CALDESC:Legal events and CLE programs in New York City
X-WR-TIMEZONE:America/New_York
${eventToICS(event)}
END:VCALENDAR`;
  } else {
    // Get all events directly from database (not just approved ones)
    const events = await prisma.event.findMany({
      where: {
        status: {
          in: ['APPROVED', 'FEATURED', 'PENDING']
        }
      },
      include: {
        location: true,
        community: true,
      },
      orderBy: {
        startDate: 'asc'
      },
      take: 1000
    });
    
    // Simple filtering (you can expand this)
    let filteredEvents = events as Event[];
    
    if (orgs.length > 0) {
      filteredEvents = filteredEvents.filter(event => 
        orgs.some(org => event.community?.name?.toLowerCase().includes(org.toLowerCase()))
      );
    }
    
    if (ids.length > 0) {
      filteredEvents = filteredEvents.filter(event => ids.includes(event.id));
    }
    
    if (cleOnly) {
      filteredEvents = filteredEvents.filter(event => 
        event.cleCredits && event.cleCredits > 0
      );
    }
    
    // Deduplicate events by name+startDate (more reliable than externalId)
    const deduplicatedEvents = filteredEvents.reduce((acc, event) => {
      const key = `${event.name}-${new Date(event.startDate).toISOString()}`;
      if (!acc.has(key)) {
        acc.set(key, event);
      }
      return acc;
    }, new Map()).values();
    
    const uniqueEvents = Array.from(deduplicatedEvents);
    
    ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Legal Events NYC//EN
CALSCALE:GREGORIAN
X-WR-CALNAME:Legal Events NYC
X-WR-CALDESC:Legal events and CLE programs in New York City
X-WR-TIMEZONE:America/New_York
${uniqueEvents.map(eventToICS).join('\n')}
END:VCALENDAR`;
  }
  
  return new NextResponse(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="legal-events-v2.ics"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate', // Prevent caching
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
