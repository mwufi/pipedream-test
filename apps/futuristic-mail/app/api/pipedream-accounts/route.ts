import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSyncClient } from '@repo/sync-helpers';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize sync client
    const syncClient = createSyncClient({
      pipedream: {
        projectId: process.env.PIPEDREAM_PROJECT_ID || '',
        clientId: process.env.PIPEDREAM_CLIENT_ID || '',
        clientSecret: process.env.PIPEDREAM_CLIENT_SECRET || '',
        environment: (process.env.PIPEDREAM_ENVIRONMENT as 'development' | 'production') || 'development'
      }
    });

    // Get accounts directly from Pipedream
    const accounts = await syncClient.getUserAccounts(userId);

    return NextResponse.json({
      accounts: accounts.map(acc => ({
        id: acc.id,
        app: {
          name: acc.app.name,
          name_slug: acc.app.name_slug
        },
        email: acc.email,
        name: acc.name,
        healthy: acc.healthy,
        dead: acc.dead,
        created_at: acc.created_at,
        updated_at: acc.updated_at
      }))
    });
  } catch (error: any) {
    console.error('Failed to fetch Pipedream accounts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}