import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'approved,featured';
    const community = searchParams.get('community');
    const location = searchParams.get('location');
    const featured = searchParams.get('featured') === 'true';

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
    
    if (location) {
      whereClause.location = {
        name: {
          contains: location,
          mode: 'insensitive'
        }
      };
    }
    
    if (featured) {
      whereClause.status = 'featured';
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
      take: Math.min(limit, 100) // Cap at 100 events
    });

    // Format for external CMS consumption (WordPress, Squarespace, etc.)
    const formattedEvents = events.map(event => ({
      id: event.id,
      title: event.name,
      description: event.description,
      content: event.description,
      excerpt: event.description?.substring(0, 200) + '...',
      status: event.status,
      start_date: event.startDate,
      end_date: event.endDate,
      created_at: event.createdAt,
      updated_at: event.updatedAt,
      location: event.location ? {
        id: event.location.id,
        name: event.location.name,
        address: event.location.address,
        city: event.location.city,
        state: event.location.state,
        zip: event.location.zip
      } : null,
      community: event.community ? {
        id: event.community.id,
        name: event.community.name,
        url: event.community.url
      } : null,
      photo: event.photo,
      url: `https://lawyerevents.net/events/${event.id}`,
      featured: event.status === 'featured',
      cms_id: event.wordpressId // Generic CMS ID field
    }));

    return NextResponse.json({
      success: true,
      data: formattedEvents,
      meta: {
        total: formattedEvents.length,
        limit,
        status,
        community,
        location,
        featured
      }
    });

  } catch (error) {
    console.error('Error fetching events for external CMS:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// POST endpoint for external CMS (WordPress/Squarespace/etc.) to submit events back
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      title, 
      description, 
      start_date, 
      end_date, 
      location_name, 
      location_address,
      community_name,
      contact_email,
      photo_url,
      cms_id, // WordPress/Squarespace/etc. post ID for reference
      cms_type = 'external' // Track which CMS submitted the event
    } = body;

    // Validate required fields
    if (!title || !description || !contact_email) {
      return NextResponse.json(
        { error: 'Title, description, and contact email are required' },
        { status: 400 }
      );
    }

    // Create or find location
    let locationId = null;
    if (location_name) {
      const location = await prisma.location.upsert({
        where: { name: location_name },
        update: {},
        create: {
          name: location_name,
          address: location_address || '',
          city: 'New York',
          state: 'NY',
          zip: ''
        }
      });
      locationId = location.id;
    }

    // Create or find community
    let communityId = null;
    if (community_name) {
      const community = await prisma.community.upsert({
        where: { name: community_name },
        update: {},
        create: {
          name: community_name,
          url: ''
        }
      });
      communityId = community.id;
    }

    // Create event
    const event = await prisma.event.create({
      data: {
        name: title,
        description,
        startDate: start_date ? new Date(start_date) : null,
        endDate: end_date ? new Date(end_date) : null,
        locationId,
        communityId,
        submittedBy: contact_email,
        photo: photo_url,
        status: 'pending', // External CMS submissions start as pending
        wordpressId: cms_id // Store CMS reference (works for any CMS)
      },
      include: {
        location: true,
        community: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Event submitted successfully',
      data: {
        id: event.id,
        status: event.status,
        cms_id: cms_id,
        cms_type: cms_type
      }
    });

  } catch (error) {
    console.error('Error creating event from external CMS:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
