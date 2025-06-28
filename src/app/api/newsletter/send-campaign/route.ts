import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getEmailProvider, isExternalEmailServiceConfigured } from '@/lib/email-service';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !ADMIN_EMAILS.includes(session.user?.email as string)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { subject, content } = await request.json();

    if (!subject || !content) {
      return NextResponse.json(
        { error: 'Subject and content are required' },
        { status: 400 }
      );
    }

    const emailProvider = getEmailProvider();
    
    // Create campaign
    const campaignId = await emailProvider.createCampaign(subject, content);
    
    // Send campaign
    const success = await emailProvider.sendCampaign(campaignId);
    
    if (success) {
      const serviceType = isExternalEmailServiceConfigured() ? 'Mailchimp' : 'Database';
      return NextResponse.json({
        success: true,
        campaignId,
        message: `Campaign sent successfully via ${serviceType}`,
        serviceType
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to send campaign' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Campaign send error:', error);
    return NextResponse.json(
      { error: 'An error occurred while sending the campaign' },
      { status: 500 }
    );
  }
} 