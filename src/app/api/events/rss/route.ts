import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status') || 'APPROVED,FEATURED';
    const community = searchParams.get('community');

    // Build where clause
    const whereClause: any = {};
    
    if (status) {
      whereClause.status = {
        in: status.split(',')
      };
    }
    
    if (community) {
      whereClause.community = {
        name: {
          contains: community,
          mode: 'insensitive'
        }
      };
    }

    const allEvents = await prisma.event.findMany({
      where: whereClause,
      orderBy: {
        startDate: 'asc'
      },
      take: Math.min(limit * 2, 200) // Get more events to account for deduplication
    });

    // Deduplicate events using the same logic as cleanup API
    const eventGroups = new Map();
    
    for (const event of allEvents) {
      const key = event.externalId || `${event.name}-${new Date(event.startDate).toISOString()}`;
      
      if (!eventGroups.has(key)) {
        eventGroups.set(key, []);
      }
      eventGroups.get(key)!.push(event);
    }
    
    // For each group, keep the event with the earliest submittedAt
    const events: any[] = [];
    for (const [key, groupEvents] of eventGroups) {
      if (groupEvents.length === 1) {
        events.push(groupEvents[0]);
      } else {
        // Sort by submittedAt and keep the oldest
        groupEvents.sort((a: any, b: any) => 
          new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
        );
        events.push(groupEvents[0]);
      }
    }
    
    // Limit to requested amount after deduplication
    const limitedEvents = events.slice(0, Math.min(limit, 100));

    // Generate RSS XML
    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>NYC Legal Events</title>
    <description>Latest legal events and networking opportunities in New York City</description>
    <link>https://lawyerevents.net</link>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://lawyerevents.net/api/events/rss" rel="self" type="application/rss+xml"/>
    
    ${limitedEvents.map(event => `
    <item>
      <title><![CDATA[${event.name}]]></title>
      <description><![CDATA[${event.description || ''}]]></description>
      <link>https://lawyerevents.net/events/${event.id}</link>
      <guid isPermaLink="true">https://lawyerevents.net/events/${event.id}</guid>
      <pubDate>${event.submittedAt.toUTCString()}</pubDate>
      <category>Legal Events</category>
      ${event.location ? `<location><![CDATA[${event.location.name}${event.location.address ? ', ' + event.location.address : ''}]]></location>` : ''}
      ${event.community ? `<community><![CDATA[${event.community.name}]]></community>` : ''}
      ${event.startDate ? `<eventDate>${event.startDate.toISOString()}</eventDate>` : ''}
      ${event.image ? `<enclosure url="${event.image}" type="image/jpeg"/>` : ''}
    </item>`).join('')}
    
  </channel>
</rss>`;

    return new NextResponse(rssXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });

  } catch (error) {
    console.error('Error generating RSS feed:', error);
    return NextResponse.json(
      { error: 'Failed to generate RSS feed' },
      { status: 500 }
    );
  }
}

