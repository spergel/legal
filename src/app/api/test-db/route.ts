import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Test database connection by counting events
    const eventCount = await prisma.event.count();
    const approvedCount = await prisma.event.count({
      where: { status: 'APPROVED' }
    });
    const featuredCount = await prisma.event.count({
      where: { status: 'FEATURED' }
    });

    // Get a sample event
    const sampleEvent = await prisma.event.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      database: 'connected',
      totalEvents: eventCount,
      approvedEvents: approvedCount,
      featuredEvents: featuredCount,
      latestEvent: sampleEvent ? {
        id: sampleEvent.id,
        name: sampleEvent.name,
        status: sampleEvent.status,
        startDate: sampleEvent.startDate,
        createdAt: sampleEvent.createdAt
      } : null,
      databaseUrl: process.env.DATABASE_URL ? 'SET (encrypted)' : 'NOT SET'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      databaseUrl: process.env.DATABASE_URL ? 'SET (encrypted)' : 'NOT SET'
    }, { status: 500 });
  }
}
