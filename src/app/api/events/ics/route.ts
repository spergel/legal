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
  
  // For now, we'll use UTC format since our database stores everything in UTC
  // In the future, we could add timezone detection based on location
  const dtstart = formatICSDate(startDate);
  const dtend = endDate ? formatICSDate(endDate) : '';
  
  // Get location information
  const location = event.locationText || 'Location TBD';

  // Get community information for context
  const community = event.communityText || '';
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

type FilterParams = { 
  orgs?: string[]; 
  ids?: string[]; 
  cleOnly?: boolean;
};

function filterEvents(events: Event[], { orgs = [], ids = [], cleOnly }: FilterParams): Event[] {
  return events.filter((event: Event) => {
    // If specific orgs or event ids are requested, we use 'OR' logic
    let idMatch = true;
    if (orgs.length > 0 || ids.length > 0) {
      const orgMatch = orgs.length > 0 && !!event.communityText && orgs.includes(event.communityText);
      const eventIdMatch = ids.length > 0 && ids.includes(event.id);
      idMatch = orgMatch || eventIdMatch;
    }

    let cleMatch = true;
    if (cleOnly) {
      cleMatch = event.hasCLE;
    }

    return idMatch && cleMatch;
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const eventId = url.searchParams.get('eventId');
  const orgs = url.searchParams.getAll('org').flatMap(o => o.split(','));
  const ids = url.searchParams.getAll('id').flatMap(i => i.split(','));
  const cleOnly = url.searchParams.get('cle_only') === 'true';

  let ics = '';
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
      orderBy: {
        startDate: 'asc'
      },
      take: 1000
    });
    
    const filteredEvents = filterEvents(events as unknown as Event[], { orgs, ids, cleOnly });
    
    // Deduplicate events using the same logic as cleanup API
    const deduplicatedEvents = filteredEvents.reduce((acc, event) => {
      const key = event.externalId || `${event.name}-${new Date(event.startDate).toISOString()}`;
      if (!acc.has(key)) {
        acc.set(key, []);
      }
      acc.get(key)!.push(event);
      return acc;
    }, new Map());
    
    // For each group, keep the event with the earliest submittedAt
    const uniqueEvents: Event[] = [];
    for (const [key, groupEvents] of deduplicatedEvents) {
      if (groupEvents.length === 1) {
        uniqueEvents.push(groupEvents[0]);
      } else {
        // Sort by createdAt and keep the oldest
        groupEvents.sort((a: Event, b: Event) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        uniqueEvents.push(groupEvents[0]);
      }
    }
    
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
      'Content-Disposition': `attachment; filename="events${eventId ? `_${eventId}` : ''}.ics"`,
    },
  });
} 
