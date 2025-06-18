import { NextResponse } from 'next/server';
import { getAllEvents } from '@/lib/data-loader';
import { Event } from '@/types';

function filterEvents(events: Event[], { orgs, ids }: { orgs: string[]; ids: string[] }): Event[] {
  return events.filter((event: Event) => {
    const orgMatch = !orgs.length || (event.communityId && orgs.includes(event.communityId));
    const idMatch = !ids.length || ids.includes(event.id);
    return orgMatch && idMatch;
  });
}

function escapeXml(unsafe: string) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const orgs = url.searchParams.getAll('org').flatMap(o => o.split(','));
  const ids = url.searchParams.getAll('id').flatMap(i => i.split(','));

  let events = await getAllEvents();
  events = filterEvents(events, { orgs, ids });

  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Legal Events Calendar</title>
    <link>https://legalevents.dev</link>
    <description>A calendar of legal events, conferences, and CLE opportunities</description>
    <language>en-us</language>
    <atom:link href="https://legalevents.dev/api/rss" rel="self" type="application/rss+xml" />
    ${events.map(event => `
    <item>
      <title>${escapeXml(event.name)}</title>
      <link>${escapeXml(event.url || '')}</link>
      <description>${escapeXml(event.description || '')}</description>
      <pubDate>${new Date(event.startDate).toUTCString()}</pubDate>
      <guid isPermaLink="false">${event.id}</guid>
      ${event.locationName ? `<location>${escapeXml(event.locationName)}</location>` : ''}
      ${event.cleCredits ? `<cleCredits>${escapeXml(String(event.cleCredits))}</cleCredits>` : ''}
      ${event.community ? `<community>${escapeXml(event.community.name)}</community>` : ''}
    </item>`).join('\n    ')}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
    },
  });
} 