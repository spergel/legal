import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const featured = searchParams.get('featured') === 'true';
    const community = searchParams.get('community');
    const hasCLE = searchParams.get('cle') === 'true';
    const days = parseInt(searchParams.get('days') || '30'); // Days ahead to show

    // Calculate date range
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    // Build where clause
    const whereClause: any = {
      status: 'APPROVED',
      startDate: {
        gte: now,
        lte: futureDate
      }
    };
    
    if (featured) {
      whereClause.status = 'FEATURED';
    }
    
    if (community) {
      whereClause.communityText = {
        contains: community,
        mode: 'insensitive'
      };
    }
    
    if (hasCLE) {
      whereClause.hasCLE = true;
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      orderBy: [
        { startDate: 'asc' },
        { name: 'asc' }
      ],
      take: limit
    });

    // Format specifically for Squarespace consumption
    const squarespaceEvents = events.map(event => ({
      // Core fields
      id: event.id,
      title: event.name,
      description: event.description,
      excerpt: event.description?.substring(0, 150).replace(/\n/g, ' ') + (event.description && event.description.length > 150 ? '...' : ''),
      
      // Dates in multiple formats for flexibility
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      startDateFormatted: event.startDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }),
      endDateFormatted: event.endDate.toLocaleDateString('en-US', {
        weekday: 'long', 
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }),
      
      // Event metadata
      location: event.locationText || 'TBD',
      community: event.communityText || 'Legal Community',
      url: event.url,
      
      // CLE information
      hasCLE: event.hasCLE,
      cleCredits: event.cleCredits,
      cleText: event.hasCLE ? `${event.cleCredits || 'TBD'} CLE Credits` : null,
      
      // Squarespace-friendly categorization
      categories: [
        event.communityText || 'Legal Events',
        ...(event.hasCLE ? ['CLE'] : []),
        ...(event.startDate > new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? ['Upcoming'] : ['This Week'])
      ].filter(Boolean),
      
      // Tags for Squarespace
      tags: [
        event.communityText?.replace(/\s+/g, '-').toLowerCase(),
        event.hasCLE ? 'cle' : 'non-cle',
        event.locationText?.includes('Virtual') || event.locationText?.includes('Online') ? 'virtual' : 'in-person'
      ].filter(Boolean),
      
      // Additional metadata
      status: event.status,
      featured: event.status === 'FEATURED',
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
      
      // Squarespace blog post compatible fields
      slug: `${event.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${event.id.slice(-8)}`,
      publishDate: event.createdAt.toISOString(),
      authorName: event.communityText,
      
      // Event-specific URLs
      eventDetailUrl: `https://legal.somethingtodo.nyc/events/${event.id}`,
      calendarSubscribeUrl: `https://legal.somethingtodo.nyc/api/events/ics?id=${event.id}`,
      googleCalendarUrl: `https://legal.somethingtodo.nyc/api/events/google?id=${event.id}`
    }));

    return NextResponse.json({
      success: true,
      meta: {
        total: squarespaceEvents.length,
        limit,
        days,
        filters: {
          featured,
          community,
          hasCLE
        },
        generated: new Date().toISOString()
      },
      events: squarespaceEvents
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' // Cache for 5 min, stale for 10 min
      }
    });

  } catch (error) {
    console.error('Error fetching events for Squarespace:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch events',
        meta: {
          generated: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}
