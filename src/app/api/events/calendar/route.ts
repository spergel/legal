import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'APPROVED,FEATURED';
    const format = searchParams.get('format') || 'ics'; // ics or json

    // Build where clause
    const whereClause: any = {};
    
    if (status) {
      whereClause.status = {
        in: status.split(',')
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
      take: 100
    });

    if (format === 'ics') {
      // Generate ICS (iCalendar) format
      const icsContent = generateICS(events);
      
      return new NextResponse(icsContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': 'attachment; filename="legal-events.ics"',
          'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        },
      });
    } else {
      // Return JSON format
      return NextResponse.json({
        success: true,
        data: events.map(event => ({
          id: event.id,
          title: event.name,
          description: event.description,
          start: event.startDate,
          end: event.endDate,
          location: event.location?.name || '',
          url: `https://lawyerevents.net/events/${event.id}`,
          status: event.status,
          community: event.community?.name || ''
        }))
      });
    }

  } catch (error) {
    console.error('Error generating calendar:', error);
    return NextResponse.json(
      { error: 'Failed to generate calendar' },
      { status: 500 }
    );
  }
}

function generateICS(events: any[]): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Legal Events//Legal Events Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:NYC Legal Events`,
    `X-WR-CALDESC:Legal events and networking opportunities in New York City`,
    `X-WR-TIMEZONE:America/New_York`,
    ''
  ];

  events.forEach(event => {
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    
    const startStr = startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endStr = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    ics.push(
      'BEGIN:VEVENT',
      `UID:${event.id}@lawyerevents.net`,
      `DTSTAMP:${timestamp}`,
      `DTSTART:${startStr}`,
      `DTEND:${endStr}`,
      `SUMMARY:${event.name}`,
      `DESCRIPTION:${event.description?.replace(/\n/g, '\\n') || ''}`,
      `LOCATION:${event.location?.name || ''}`,
      `URL:https://lawyerevents.net/events/${event.id}`,
      `STATUS:CONFIRMED`,
      'END:VEVENT'
    );
  });

  ics.push('END:VCALENDAR');
  
  return ics.join('\r\n');
}
