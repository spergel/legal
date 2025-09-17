import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    console.log('Testing database connection...');
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

    // Simple connection test
    await prisma.$connect();
    console.log('Database connection successful');

    // Test basic query
    const eventCount = await prisma.event.count();
    console.log(`Found ${eventCount} events`);

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      eventCount: eventCount,
      databaseUrl: process.env.DATABASE_URL ? 'SET (encrypted)' : 'NOT SET',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      databaseUrl: process.env.DATABASE_URL ? 'SET (encrypted)' : 'NOT SET',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
