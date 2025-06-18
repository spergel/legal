import { NextResponse } from 'next/server';
import { getAllEvents, getEventById } from '@/lib/data-loader';
import { Event } from '@/types';

function escapeICalText(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function eventToICS(event: Event) {
  return `BEGIN:VEVENT\nUID:${event.id}@eventcalendar\nSUMMARY:${escapeICalText(event.name)}\nDESCRIPTION:${escapeICalText(event.description || '')}\nDTSTART:${new Date(event.startDate).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z').replace('T', '')}\n${event.endDate ? `DTEND:${new Date(event.endDate).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z').replace('T', '')}\n` : ''}URL:${event.url || ''}
END:VEVENT`;
}

type FilterParams = { orgs: string[]; ids: string[] };

function filterEvents(events: Event[], { orgs, ids }: FilterParams): Event[] {
  return events.filter((event: Event) => {
    const orgMatch = !orgs.length || (event.communityId && orgs.includes(event.communityId));
    const idMatch = !ids.length || ids.includes(event.id);
    return orgMatch && idMatch;
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const eventId = url.searchParams.get('eventId');
  const orgs = url.searchParams.getAll('org').flatMap(o => o.split(','));
  const ids = url.searchParams.getAll('id').flatMap(i => i.split(','));
  let ics = '';
  if (eventId) {
    const event = await getEventById(eventId);
    if (!event) {
      return new NextResponse('Event not found', { status: 404 });
    }
    ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Event Calendar//EN\nCALSCALE:GREGORIAN\n${eventToICS(event)}\nEND:VCALENDAR`;
  } else {
    let events = await getAllEvents();
    events = filterEvents(events, { orgs, ids });
    ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Event Calendar//EN\nCALSCALE:GREGORIAN\n${events.map(eventToICS).join('\n')}\nEND:VCALENDAR`;
  }
  return new NextResponse(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="events${eventId ? `_${eventId}` : ''}.ics"`,
    },
  });
} 