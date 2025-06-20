import { BaseSyncService, SyncConfig } from './base-sync-service'
import { db, calendarEvents, accounts, syncJobs } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'crypto'

interface GoogleCalendarEvent {
  id: string
  status?: string
  summary?: string
  description?: string
  location?: string
  start?: {
    date?: string
    dateTime?: string
    timeZone?: string
  }
  end?: {
    date?: string
    dateTime?: string
    timeZone?: string
  }
  organizer?: {
    email?: string
    displayName?: string
  }
  attendees?: Array<{
    email: string
    displayName?: string
    responseStatus?: string
    organizer?: boolean
  }>
  conferenceData?: {
    entryPoints?: Array<{
      entryPointType: string
      uri: string
    }>
  }
  visibility?: string
  transparency?: string
  recurringEventId?: string
  recurrence?: string[]
  created?: string
  updated?: string
}

export class CalendarSyncService extends BaseSyncService {
  async sync(config: SyncConfig) {
    try {
      await this.createSyncJob(config)
      await this.updateSyncJob({ 
        status: 'processing',
        startedAt: new Date()
      })

      // Get the account
      const account = await db.query.accounts.findFirst({
        where: eq(accounts.id, config.accountId)
      })

      if (!account) {
        throw new Error('Account not found')
      }

      // Calculate date range (1 month ago to 1 month from now)
      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
      
      const oneMonthFromNow = new Date()
      oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1)

      // Get list of calendars
      const calendars = await this.getCalendarList(config)
      
      // Sync events from each calendar
      for (const calendar of calendars) {
        await this.syncCalendarEvents(
          config, 
          calendar.id, 
          oneMonthAgo.toISOString(),
          oneMonthFromNow.toISOString()
        )
      }

      // Update last synced timestamp
      await db.update(accounts)
        .set({ 
          lastSyncedAt: new Date(),
          syncState: { 
            ...account.syncState as any,
            calendarLastSync: new Date().toISOString() 
          }
        })
        .where(eq(accounts.id, config.accountId))

      await this.updateSyncJob({ 
        status: 'completed',
        completedAt: new Date()
      })
    } catch (error) {
      console.error('Calendar sync failed:', error)
      await this.updateSyncJob({ 
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date()
      })
      throw error
    }
  }

  private async getCalendarList(config: SyncConfig) {
    await this.rateLimiter.wait(2)

    const response = await this.apiClient.makeRequest(() =>
      this.fetchWithPipedreamProxy(
        config.pipedreamAccountId,
        'https://www.googleapis.com/calendar/v3/users/me/calendarList',
        undefined,
        config.userId
      )
    )

    return response.items || []
  }

  private async syncCalendarEvents(
    config: SyncConfig,
    calendarId: string,
    timeMin: string,
    timeMax: string
  ) {
    let pageToken: string | undefined
    let totalEvents = 0
    let processedEvents = 0

    do {
      await this.rateLimiter.wait(3)

      const response = await this.apiClient.makeRequest(() =>
        this.fetchWithPipedreamProxy(
          config.pipedreamAccountId,
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?` +
          `timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=100` +
          (pageToken ? `&pageToken=${pageToken}` : ''),
          undefined,
          config.userId
        )
      )

      const events = response.items || []
      totalEvents += events.length
      
      await this.updateSyncJob({ totalItems: totalEvents })

      // Process events
      for (const event of events) {
        try {
          await this.syncSingleEvent(config, event)
          processedEvents++
          await this.updateSyncJob({ processedItems: processedEvents })
        } catch (error) {
          console.error(`Failed to sync event ${event.id}:`, error)
          await this.updateSyncJob({ 
            failedItems: (await this.getSyncJobFailedCount()) + 1 
          })
        }
      }

      pageToken = response.nextPageToken
    } while (pageToken)
  }

  private async syncSingleEvent(config: SyncConfig, event: GoogleCalendarEvent) {
    // Skip cancelled events
    if (event.status === 'cancelled') {
      return
    }

    // Parse start and end times
    const startTime = event.start?.dateTime 
      ? new Date(event.start.dateTime) 
      : event.start?.date 
        ? new Date(event.start.date) 
        : new Date()
    
    const endTime = event.end?.dateTime 
      ? new Date(event.end.dateTime) 
      : event.end?.date 
        ? new Date(event.end.date) 
        : new Date()

    const isAllDay = !!(event.start?.date || event.end?.date)

    // Extract meeting URL
    let meetingUrl: string | undefined
    if (event.conferenceData?.entryPoints) {
      const videoEntry = event.conferenceData.entryPoints.find(
        e => e.entryPointType === 'video'
      )
      meetingUrl = videoEntry?.uri
    }

    // Format attendees
    const attendees = event.attendees?.map(attendee => ({
      email: attendee.email,
      name: attendee.displayName,
      responseStatus: attendee.responseStatus,
      isOrganizer: attendee.organizer || false
    })) || []

    // Determine if user is busy
    const isBusy = event.transparency !== 'transparent'

    await db.insert(calendarEvents)
      .values({
        id: randomUUID(),
        userId: config.userId,
        accountId: config.accountId,
        googleEventId: event.id,
        title: event.summary || '(no title)',
        description: event.description,
        location: event.location,
        startTime,
        endTime,
        isAllDay,
        timezone: event.start?.timeZone || event.end?.timeZone,
        organizer: event.organizer ? {
          email: event.organizer.email,
          name: event.organizer.displayName
        } : undefined,
        attendees,
        status: event.status || 'confirmed',
        visibility: event.visibility || 'default',
        isBusy,
        meetingUrl,
        conferenceData: event.conferenceData || {},
        isRecurring: !!event.recurringEventId || !!event.recurrence,
        recurringEventId: event.recurringEventId,
        recurrenceRule: event.recurrence?.join('\n'),
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: [calendarEvents.googleEventId, calendarEvents.accountId],
        set: {
          title: event.summary || '(no title)',
          description: event.description,
          location: event.location,
          startTime,
          endTime,
          isAllDay,
          timezone: event.start?.timeZone || event.end?.timeZone,
          organizer: event.organizer ? {
            email: event.organizer.email,
            name: event.organizer.displayName
          } : undefined,
          attendees,
          status: event.status || 'confirmed',
          visibility: event.visibility || 'default',
          isBusy,
          meetingUrl,
          conferenceData: event.conferenceData || {},
          isRecurring: !!event.recurringEventId || !!event.recurrence,
          recurringEventId: event.recurringEventId,
          recurrenceRule: event.recurrence?.join('\n'),
          updatedAt: new Date()
        }
      })
  }

  private async getSyncJobFailedCount(): Promise<number> {
    if (!this.syncJobId) return 0
    
    const job = await db.query.syncJobs.findFirst({
      where: eq(syncJobs.id, this.syncJobId)
    })
    
    return job?.failedItems || 0
  }
}