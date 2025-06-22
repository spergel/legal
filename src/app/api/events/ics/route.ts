import { NextResponse } from 'next/server';
import { getAllEvents, getEventById } from '@/lib/data-loader';
import { Event } from '@/types';

function escapeICalText(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function eventToICS(event: Event) {
  const description = event.description ? escapeICalText(event.description) : '';
  return `BEGIN:VEVENT\nUID:${event.id}@eventcalendar\nSUMMARY:${escapeICalText(event.name)}\nDESCRIPTION:${description}\nDTSTART:${new Date(event.startDate).toISOString().replace(/[-:]/g, '').replace(/\\.\\d{3}Z$/, 'Z')}\n${event.endDate ? `DTEND:${new Date(event.endDate).toISOString().replace(/[-:]/g, '').replace(/\\.\\d{3}Z$/, 'Z')}\n` : ''}URL:${event.url || ''}
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
      const orgMatch = orgs.length > 0 && !!event.communityId && orgs.includes(event.communityId);
      const eventIdMatch = ids.length > 0 && ids.includes(event.id);
      idMatch = orgMatch || eventIdMatch;
    }

    let cleMatch = true;
    if (cleOnly) {
      cleMatch = (event.eventType === 'CLE' || (event.category || []).includes('CLE'));
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
    ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Event Calendar//EN\nCALSCALE:GREGORIAN\n${eventToICS(event)}\nEND:VCALENDAR`;
  } else {
    const events = await getAllEvents();
    
    const filteredEvents = filterEvents(events, { orgs, ids, cleOnly });
    ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Event Calendar//EN\nCALSCALE:GREGORIAN\n${filteredEvents.map(eventToICS).join('\n')}\nEND:VCALENDAR`;
  }
  return new NextResponse(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="events${eventId ? `_${eventId}` : ''}.ics"`,
    },
  });
} 