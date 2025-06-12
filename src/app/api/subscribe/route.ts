import { NextRequest, NextResponse } from 'next/server';
import mailchimp from '@mailchimp/mailchimp_marketing';

// Configure Mailchimp API client
if (!process.env.MAILCHIMP_API_KEY || !process.env.MAILCHIMP_SERVER_PREFIX) {
  console.warn(
    'Mailchimp API Key or Server Prefix not found. Subscription will not work. '
    + 'Please set MAILCHIMP_API_KEY and MAILCHIMP_SERVER_PREFIX environment variables.'
  );
}

mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: process.env.MAILCHIMP_SERVER_PREFIX,
});

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  // Basic email validation regex (you might want a more robust one)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
  }

  const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;
  if (!audienceId) {
    console.error('Mailchimp Audience ID not found. Please set MAILCHIMP_AUDIENCE_ID environment variable.');
    return NextResponse.json({ error: 'Subscription configuration error.' }, { status: 500 });
  }

  try {
    await mailchimp.lists.addListMember(audienceId, {
      email_address: email,
      status: 'subscribed', // or 'pending' for double opt-in
    });

    // The Mailchimp API client might throw an error for existing members or other issues,
    // so successful execution here usually means it worked or it's pending.
    // For more specific status handling, you might need to inspect `response` if the client doesn't throw.
    // However, the official client often throws errors for non-2xx responses.
    // If response is directly available and not an error, it usually means success.
    return NextResponse.json({ message: 'Successfully subscribed!' }, { status: 200 });

  } catch (error: unknown) {
    console.error('Mailchimp API Error:', error);
    let errorMessage = 'Subscription failed. Please try again later.';
    let statusCode = 500;

    // Check for Mailchimp specific error for existing member or other common errors
    if (error instanceof Error && error.message) {
        errorMessage = error.message;
    } else if (
        typeof error === 'object' &&
        error !== null &&
        'status' in error &&
        'response' in error &&
        typeof (error as { status: number; response: { text: string } }).response.text === 'string'
    ) {
        const errObj = error as { status: number; response: { text: string } };
        const body = JSON.parse(errObj.response.text);
        if (body.title === 'Member Exists') {
            errorMessage = 'This email is already subscribed.';
            statusCode = 200;
        } else if (body.detail) {
            errorMessage = body.detail;
            statusCode = errObj.status;
        } else {
            errorMessage = `An error occurred: ${body.title || 'Unknown Mailchimp error'}`;
            statusCode = errObj.status;
        }
    }
    
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
} 