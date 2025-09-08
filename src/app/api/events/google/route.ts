import { NextRequest, NextResponse } from 'next/server';
import { getEventById } from '@/lib/data-loader';

function toGCalDate(dt: string | Date): string {
  const d = typeof dt === 'string' ? new Date(dt) : dt;
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const eventId = url.searchParams.get('eventId');
  const mode = url.searchParams.get('mode') || 'redirect'; // redirect | json

  if (!eventId) {
    return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });
  }

  const event = await getEventById(eventId);
  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  const params = new URLSearchParams();
  params.set('action', 'TEMPLATE');
  params.set('text', event.name || 'Event');
  if (event.startDate) {
    const start = toGCalDate(event.startDate);
    const end = toGCalDate(event.endDate || event.startDate);
    params.set('dates', `${start}/${end}`);
  }
  if (event.description) params.set('details', event.description);
  if (event.locationName) params.set('location', event.locationName);
  if (event.url) params.set('sprop', `website:${event.url}`);

  const gcalUrl = `https://calendar.google.com/calendar/render?${params.toString()}`;

  if (mode === 'json') {
    return NextResponse.json({ url: gcalUrl });
  }
  return NextResponse.redirect(gcalUrl, { status: 302 });
}


