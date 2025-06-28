import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getEmailProvider, isExternalEmailServiceConfigured } from '@/lib/email-service';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !ADMIN_EMAILS.includes(session.user?.email as string)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const emailProvider = getEmailProvider();
    const active = await emailProvider.getSubscriberCount();

    return NextResponse.json({
      total: active,
      active,
      inactive: 0, // External services don't typically provide this breakdown
      serviceType: isExternalEmailServiceConfigured() ? 'Mailchimp' : 'Database'
    });
  } catch (error) {
    console.error('Subscriber stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriber stats' },
      { status: 500 }
    );
  }
} 