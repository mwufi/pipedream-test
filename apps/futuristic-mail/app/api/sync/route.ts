import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db, accounts } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { GmailSyncService } from '@/lib/services/sync/gmail-sync-service'
import { CalendarSyncService } from '@/lib/services/sync/calendar-sync-service'
import { ContactsSyncService } from '@/lib/services/sync/contacts-sync-service'
import { createSyncClient } from '@repo/sync-helpers'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { accountId, syncType } = body

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 })
    }

    if (!syncType || !['email', 'calendar', 'contacts', 'all', 'auto'].includes(syncType)) {
      return NextResponse.json({ error: 'Invalid sync type' }, { status: 400 })
    }

    // Initialize sync client to get account info from Pipedream
    const syncClient = createSyncClient({
      pipedream: {
        projectId: process.env.PIPEDREAM_PROJECT_ID || '',
        clientId: process.env.PIPEDREAM_CLIENT_ID || '',
        clientSecret: process.env.PIPEDREAM_CLIENT_SECRET || '',
        environment: (process.env.PIPEDREAM_ENVIRONMENT as 'development' | 'production') || 'development'
      }
    })

    // Get account info from Pipedream to determine the app type
    const pipedreamAccounts = await syncClient.getUserAccounts(userId)
    const pipedreamAccount = pipedreamAccounts.find(acc => acc.id === accountId)
    
    if (!pipedreamAccount) {
      return NextResponse.json({ error: 'Account not found in Pipedream' }, { status: 404 })
    }

    // Get or create the account in our database
    let account = await db.query.accounts.findFirst({
      where: and(
        eq(accounts.pipedreamAccountId, accountId),
        eq(accounts.userId, userId)
      )
    })

    if (!account) {
      // Create account if it doesn't exist
      const newAccountId = crypto.randomUUID()
      await db.insert(accounts).values({
        id: newAccountId,
        userId,
        pipedreamAccountId: accountId,
        provider: pipedreamAccount.app.name_slug as any,
        email: pipedreamAccount.email || pipedreamAccount.name || 'unknown',
        name: pipedreamAccount.name || pipedreamAccount.email || 'Unknown Account',
        isActive: pipedreamAccount.healthy,
        syncState: {},
        createdAt: new Date(),
        updatedAt: new Date()
      })
      
      account = await db.query.accounts.findFirst({
        where: eq(accounts.id, newAccountId)
      })
    }

    if (!account) {
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
    }

    const syncConfig = {
      userId,
      accountId: account.id,
      pipedreamAccountId: account.pipedreamAccountId,
      type: '' as 'email' | 'calendar' | 'contacts'
    }

    const syncJobs = []
    const appType = pipedreamAccount.app.name_slug

    // Determine what to sync based on sync type and app type
    if (syncType === 'auto') {
      // Auto-detect based on app type
      switch (appType) {
        case 'gmail':
          const gmailSync = new GmailSyncService()
          syncJobs.push(gmailSync.sync({ ...syncConfig, type: 'email' }))
          break
        case 'google_calendar':
          const calendarSync = new CalendarSyncService()
          syncJobs.push(calendarSync.sync({ ...syncConfig, type: 'calendar' }))
          break
        case 'google_contacts':
          const contactsSync = new ContactsSyncService()
          syncJobs.push(contactsSync.sync({ ...syncConfig, type: 'contacts' }))
          break
        default:
          return NextResponse.json({ 
            error: `Unsupported app type: ${appType}. Supported types: gmail, google_calendar, google_contacts` 
          }, { status: 400 })
      }
    } else if (syncType === 'all') {
      // Only sync services that match the app type
      if (appType === 'gmail') {
        const gmailSync = new GmailSyncService()
        syncJobs.push(gmailSync.sync({ ...syncConfig, type: 'email' }))
      }
      if (appType === 'google_calendar') {
        const calendarSync = new CalendarSyncService()
        syncJobs.push(calendarSync.sync({ ...syncConfig, type: 'calendar' }))
      }
      if (appType === 'google_contacts') {
        const contactsSync = new ContactsSyncService()
        syncJobs.push(contactsSync.sync({ ...syncConfig, type: 'contacts' }))
      }
    } else {
      // Manual sync type selection - verify it matches the app
      const validCombinations = {
        'email': ['gmail'],
        'calendar': ['google_calendar'],
        'contacts': ['google_contacts']
      }
      
      if (!validCombinations[syncType]?.includes(appType)) {
        return NextResponse.json({ 
          error: `Cannot sync ${syncType} for ${appType} account. This account type only supports: ${appType.replace('_', ' ')}` 
        }, { status: 400 })
      }

      // Start the requested sync
      if (syncType === 'email') {
        const gmailSync = new GmailSyncService()
        syncJobs.push(gmailSync.sync({ ...syncConfig, type: 'email' }))
      } else if (syncType === 'calendar') {
        const calendarSync = new CalendarSyncService()
        syncJobs.push(calendarSync.sync({ ...syncConfig, type: 'calendar' }))
      } else if (syncType === 'contacts') {
        const contactsSync = new ContactsSyncService()
        syncJobs.push(contactsSync.sync({ ...syncConfig, type: 'contacts' }))
      }
    }

    // Run syncs in parallel
    await Promise.all(syncJobs)

    return NextResponse.json({ 
      success: true,
      message: `${syncType} sync completed successfully`,
      accountType: appType,
      syncedServices: syncJobs.length
    })
  } catch (error) {
    console.error('Sync API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    )
  }
}

// Get sync status
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 })
    }

    // Get the account with latest sync info
    const account = await db.query.accounts.findFirst({
      where: and(
        eq(accounts.id, accountId),
        eq(accounts.userId, userId)
      )
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Get recent sync jobs
    const syncJobs = await db.query.syncJobs.findMany({
      where: and(
        eq(accounts.userId, userId),
        eq(accounts.id, accountId)
      ),
      orderBy: (syncJobs, { desc }) => [desc(syncJobs.createdAt)],
      limit: 10
    })

    return NextResponse.json({
      account: {
        id: account.id,
        email: account.email,
        lastSyncedAt: account.lastSyncedAt,
        syncState: account.syncState
      },
      recentSyncJobs: syncJobs
    })
  } catch (error) {
    console.error('Get sync status error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get sync status' },
      { status: 500 }
    )
  }
}