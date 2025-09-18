import { NextResponse } from 'next/server';
import { getAllEvents } from '@/lib/data-loader';
import { Event } from '@/types';

function filterEvents(events: Event[], { orgs, ids }: { orgs: string[]; ids: string[] }): Event[] {
  return events.filter((event: Event) => {
    const orgMatch = !orgs.length || (event.communityText && orgs.includes(event.communityText));
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
  console.log('🔍 [RSS] RSS feed requested');

  const url = new URL(req.url);
  const orgs = url.searchParams.getAll('org').flatMap(o => o.split(','));
  const ids = url.searchParams.getAll('id').flatMap(i => i.split(','));

  console.log('🔍 [RSS] Filters - orgs:', orgs, 'ids:', ids);

  let events = await getAllEvents();
  console.log(`📊 [RSS] getAllEvents returned ${events.length} events`);

  events = filterEvents(events, { orgs, ids });
  console.log(`📊 [RSS] After filtering: ${events.length} events`);

  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Legal Events Calendar - NYC</title>
    <link>https://legal.somethingtodo.nyc</link>
    <description>Comprehensive calendar of legal events, conferences, CLE opportunities, and networking events in New York City</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <managingEditor>events@legal.somethingtodo.nyc (Legal Events Calendar)</managingEditor>
    <webMaster>admin@legal.somethingtodo.nyc (Legal Events Calendar)</webMaster>
    <atom:link href="https://legal.somethingtodo.nyc/api/rss" rel="self" type="application/rss+xml" />
    <image>
      <url>https://legal.somethingtodo.nyc/gavel-calendar-icon.svg</url>
      <title>Legal Events Calendar - NYC</title>
      <link>https://legal.somethingtodo.nyc</link>
    </image>
    ${events.map(event => {
      const eventStartDate = new Date(event.startDate);
      const eventEndDate = new Date(event.endDate);
      const formattedDate = eventStartDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric', 
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
      
      return `
    <item>
      <title>${escapeXml(event.name)}</title>
      <link>${escapeXml(event.url || `https://legal.somethingtodo.nyc/events/${event.id}`)}</link>
      <description><![CDATA[
        <h3>${escapeXml(event.name)}</h3>
        <p><strong>When:</strong> ${formattedDate}</p>
        ${event.locationText ? `<p><strong>Location:</strong> ${escapeXml(event.locationText)}</p>` : ''}
        ${event.communityText ? `<p><strong>Hosted by:</strong> ${escapeXml(event.communityText)}</p>` : ''}
        ${event.hasCLE && event.cleCredits ? `<p><strong>CLE Credits:</strong> ${escapeXml(String(event.cleCredits))}</p>` : ''}
        <p>${escapeXml(event.description || '')}</p>
        ${event.url ? `<p><a href="${escapeXml(event.url)}">View Event Details</a></p>` : ''}
      ]]></description>
      <content:encoded><![CDATA[
        <div class="legal-event">
          <h2>${escapeXml(event.name)}</h2>
          <div class="event-meta">
            <p class="event-date"><strong>📅 Date:</strong> ${formattedDate}</p>
            ${event.locationText ? `<p class="event-location"><strong>📍 Location:</strong> ${escapeXml(event.locationText)}</p>` : ''}
            ${event.communityText ? `<p class="event-host"><strong>🏛️ Hosted by:</strong> ${escapeXml(event.communityText)}</p>` : ''}
            ${event.hasCLE && event.cleCredits ? `<p class="event-cle"><strong>⚖️ CLE Credits:</strong> ${escapeXml(String(event.cleCredits))}</p>` : ''}
          </div>
          <div class="event-description">
            <p>${escapeXml(event.description || '')}</p>
          </div>
          ${event.url ? `<p class="event-link"><a href="${escapeXml(event.url)}" target="_blank">Register/Learn More</a></p>` : ''}
        </div>
      ]]></content:encoded>
      <pubDate>${eventStartDate.toUTCString()}</pubDate>
      <guid isPermaLink="false">${event.id}</guid>
      <dc:creator>${escapeXml(event.communityText || 'Legal Events Calendar')}</dc:creator>
      <category>${escapeXml(event.communityText || 'Legal Events')}</category>
      ${event.hasCLE ? '<category>CLE</category>' : ''}
      ${event.locationText?.includes('Virtual') || event.locationText?.includes('Online') ? '<category>Virtual Event</category>' : '<category>In-Person Event</category>'}
    </item>`;
    }).join('\n    ')}
  </channel>
</rss>`;

  console.log(`📊 [RSS] Generated RSS with ${events.length} items`);
  return new NextResponse(rss, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
    },
  });
} 