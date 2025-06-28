import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { Resend } from 'resend';

const prisma = new PrismaClient();
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

// POST - Send newsletter
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !ADMIN_EMAILS.includes(session.user?.email as string)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get newsletter
    const newsletter = await prisma.newsletter.findUnique({
      where: { id: params.id }
    });

    if (!newsletter) {
      return NextResponse.json(
        { error: 'Newsletter not found' },
        { status: 404 }
      );
    }

    if (newsletter.status === 'SENT') {
      return NextResponse.json(
        { error: 'Newsletter has already been sent' },
        { status: 400 }
      );
    }

    // Get active subscribers
    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: { isActive: true }
    });

    if (subscribers.length === 0) {
      return NextResponse.json(
        { error: 'No active subscribers found' },
        { status: 400 }
      );
    }

    // Update newsletter status to SENDING
    await prisma.newsletter.update({
      where: { id: params.id },
      data: { status: 'SENDING' }
    });

    // Check if email service is configured
    if (!resend) {
      return NextResponse.json(
        { error: 'Email service not configured. Please set RESEND_API_KEY environment variable.' },
        { status: 500 }
      );
    }

    // Send emails in batches to avoid rate limits
    const batchSize = 50;
    let sentCount = 0;
    
    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);
      
      try {
        await resend.emails.send({
          from: process.env.FROM_EMAIL || 'newsletter@yourdomain.com',
          to: batch.map((sub: any) => sub.email),
          subject: newsletter.subject,
          html: addUnsubscribeLink(newsletter.content, subscribers.map((s: any) => s.email))
        });
        
        sentCount += batch.length;
      } catch (error) {
        console.error(`Failed to send batch ${i}-${i + batchSize}:`, error);
        // Continue with other batches
      }
    }

    // Update newsletter with results
    await prisma.newsletter.update({
      where: { id: params.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        recipients: sentCount
      }
    });

    return NextResponse.json({
      success: true,
      sentCount,
      totalSubscribers: subscribers.length
    });
  } catch (error) {
    console.error('Newsletter send error:', error);
    
    // Reset status if there was an error
    try {
      await prisma.newsletter.update({
        where: { id: params.id },
        data: { status: 'DRAFT' }
      });
    } catch (resetError) {
      console.error('Failed to reset newsletter status:', resetError);
    }
    
    return NextResponse.json(
      { error: 'Failed to send newsletter' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

function addUnsubscribeLink(content: string, emails: string[]): string {
  const unsubscribeFooter = `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
      <p>You're receiving this email because you subscribed to legal event updates.</p>
      <p><a href="${process.env.NEXTAUTH_URL}/unsubscribe" style="color: #666;">Unsubscribe</a> | <a href="${process.env.NEXTAUTH_URL}" style="color: #666;">Visit our website</a></p>
    </div>
  `;
  
  return content + unsubscribeFooter;
} 