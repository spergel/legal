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

    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
        location: true,
        community: true,
      },
      orderBy: {
        startDate: 'asc'
      },
      take: Math.min(limit, 100)
    });

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
    
    ${events.map(event => `
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
