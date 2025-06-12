import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Here you would typically add the email to your database or mailing list
    // For now, we'll just return success
    console.log('Subscription request received for:', email);

    return NextResponse.json(
      { message: 'Successfully subscribed!' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Subscription Error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your subscription' },
      { status: 500 }
    );
  }
} 