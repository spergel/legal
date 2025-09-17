import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

// Create a singleton Prisma instance to avoid connection overhead
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const eventId = params.id;
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // TODO: Implement starring system after restoring UserEvent model
    return NextResponse.json({ 
      error: 'Starring functionality temporarily disabled during schema simplification',
      starred: false 
    }, { status: 501 });
  } catch (error) {
    console.error('Error toggling star:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ starred: false });
  }

  try {
    const eventId = params.id;
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ starred: false });
    }

    // TODO: Implement starring system after restoring UserEvent model
    return NextResponse.json({ starred: false });
  } catch (error) {
    console.error('Error checking star status:', error);
    return NextResponse.json({ starred: false });
  }
} 