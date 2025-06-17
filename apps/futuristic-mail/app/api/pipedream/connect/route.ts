import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { provider } = await request.json();

    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 });
    }

    // Map our provider names to Pipedream app names
    const providerMap: Record<string, string> = {
      'gmail': 'gmail',
      'google_calendar': 'google_calendar',
      'google_contacts': 'google_contacts',
      'outlook': 'microsoft_outlook'
    };

    const pipedreamApp = providerMap[provider];
    if (!pipedreamApp) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    // Generate the Pipedream Connect URL
    const connectUrl = new URL('https://api.pipedream.com/v1/connect');
    
    connectUrl.searchParams.append('project_id', process.env.PIPEDREAM_PROJECT_ID!);
    connectUrl.searchParams.append('app', pipedreamApp);
    connectUrl.searchParams.append('external_user_id', userId);
    
    // Optional: Add redirect URL for after connection
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/onboarding?connected=${provider}`;
    connectUrl.searchParams.append('redirect_url', redirectUrl);

    // Optional: Add webhook URL to get notified of connection
    // connectUrl.searchParams.append('webhook_url', `${process.env.NEXT_PUBLIC_APP_URL}/api/pipedream/webhook`);

    // Generate the auth token for the Connect URL
    const authToken = Buffer.from(
      `${process.env.PIPEDREAM_CLIENT_ID}:${process.env.PIPEDREAM_CLIENT_SECRET}`
    ).toString('base64');

    // In production, you would make a server-side request to Pipedream
    // to generate a secure connect token. For now, return the URL structure.
    
    return NextResponse.json({
      connectUrl: connectUrl.toString(),
      provider: provider,
      // In production, include a secure token from Pipedream
      // token: pipedreamConnectToken
    });

  } catch (error: any) {
    console.error('Connect URL generation error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to generate connect URL'
    }, { status: 500 });
  }
}

// Handle the callback after connection
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider');
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (error) {
      // Handle connection error
      return NextResponse.redirect(
        new URL(`/onboarding?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (success && provider) {
      // Connection successful
      return NextResponse.redirect(
        new URL(`/onboarding?connected=${provider}`, request.url)
      );
    }

    return NextResponse.redirect(new URL('/onboarding', request.url));
  } catch (error) {
    console.error('Connect callback error:', error);
    return NextResponse.redirect(new URL('/onboarding?error=callback_failed', request.url));
  }
}