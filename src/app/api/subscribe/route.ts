import { NextRequest, NextResponse } from 'next/server';
import { isValidEmail } from '@/lib/utils';
import { getEmailProvider, isExternalEmailServiceConfigured } from '@/lib/email-service';

export async function POST(request: Request) {
  try {
    const { email, name, preferences } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    const emailProvider = getEmailProvider();
    const success = await emailProvider.addSubscriber(email, name);

    if (success) {
      const serviceType = isExternalEmailServiceConfigured() ? 'Mailchimp' : 'our system';
      return NextResponse.json(
        { message: `Successfully subscribed to legal event updates via ${serviceType}!` },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to subscribe. Please try again.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Subscription Error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your subscription' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailProvider = getEmailProvider();
    const success = await emailProvider.removeSubscriber(email);

    if (success) {
      return NextResponse.json(
        { message: 'Successfully unsubscribed from newsletter' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to unsubscribe. Please try again.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unsubscribe Error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your unsubscription' },
      { status: 500 }
    );
  }
} 