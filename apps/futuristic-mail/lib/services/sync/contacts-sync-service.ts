import { BaseSyncService, SyncConfig } from './base-sync-service'
import { db, contacts, accounts, emails, syncJobs } from '@/lib/db'
import { eq, and, inArray, desc } from 'drizzle-orm'
import { randomUUID } from 'crypto'

interface GoogleContact {
  resourceName: string
  etag: string
  names?: Array<{
    displayName?: string
    familyName?: string
    givenName?: string
    displayNameLastFirst?: string
  }>
  emailAddresses?: Array<{
    value: string
    type?: string
    formattedType?: string
  }>
  phoneNumbers?: Array<{
    value: string
    type?: string
  }>
  organizations?: Array<{
    name?: string
    title?: string
    department?: string
  }>
  biographies?: Array<{
    value: string
    contentType?: string
  }>
  photos?: Array<{
    url: string
    default?: boolean
  }>
  addresses?: Array<{
    formattedValue?: string
    city?: string
    country?: string
    postalCode?: string
    region?: string
    streetAddress?: string
  }>
  urls?: Array<{
    value: string
    type?: string
  }>
}

export class ContactsSyncService extends BaseSyncService {
  async sync(config: SyncConfig) {
    try {
      await this.createSyncJob(config)
      await this.updateSyncJob({ 
        status: 'processing',
        startedAt: new Date()
      })

      const account = await db.query.accounts.findFirst({
        where: eq(accounts.id, config.accountId)
      })

      if (!account) {
        throw new Error('Account not found')
      }

      // Sync Google Contacts
      await this.syncGoogleContacts(config)

      // Extract contacts from recent emails
      await this.extractContactsFromEmails(config)

      // Update last synced timestamp
      await db.update(accounts)
        .set({ 
          lastSyncedAt: new Date(),
          syncState: { 
            ...account.syncState as any,
            contactsLastSync: new Date().toISOString() 
          }
        })
        .where(eq(accounts.id, config.accountId))

      await this.updateSyncJob({ 
        status: 'completed',
        completedAt: new Date()
      })
    } catch (error) {
      console.error('Contacts sync failed:', error)
      await this.updateSyncJob({ 
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date()
      })
      throw error
    }
  }

  private async syncGoogleContacts(config: SyncConfig) {
    let pageToken: string | undefined
    let totalContacts = 0
    let processedContacts = 0

    do {
      await this.rateLimiter.wait(3)

      const response = await this.apiClient.makeRequest(() =>
        this.fetchWithPipedreamProxy(
          config.pipedreamAccountId,
          `https://people.googleapis.com/v1/people/me/connections?` +
          `personFields=names,emailAddresses,phoneNumbers,organizations,biographies,photos,addresses,urls` +
          `&pageSize=100` +
          (pageToken ? `&pageToken=${pageToken}` : ''),
          undefined,
          config.userId
        )
      )

      const connections = response.connections || []
      totalContacts += connections.length
      
      await this.updateSyncJob({ totalItems: totalContacts })

      // Process contacts
      for (const contact of connections) {
        try {
          await this.syncSingleContact(config, contact, 'google')
          processedContacts++
          await this.updateSyncJob({ processedItems: processedContacts })
        } catch (error) {
          console.error(`Failed to sync contact ${contact.resourceName}:`, error)
          await this.updateSyncJob({ 
            failedItems: (await this.getSyncJobFailedCount()) + 1 
          })
        }
      }

      pageToken = response.nextPageToken
    } while (pageToken)
  }

  private async syncSingleContact(
    config: SyncConfig, 
    contact: GoogleContact,
    source: 'google' | 'gmail'
  ) {
    // Skip if no email addresses
    if (!contact.emailAddresses || contact.emailAddresses.length === 0) {
      return
    }

    // Get primary email
    const primaryEmail = contact.emailAddresses[0].value
    
    // Extract name information
    const name = contact.names?.[0]
    const displayName = name?.displayName || primaryEmail
    const firstName = name?.givenName
    const lastName = name?.familyName

    // Extract organization info
    const org = contact.organizations?.[0]
    const company = org?.name
    const jobTitle = org?.title

    // Extract phone
    const phone = contact.phoneNumbers?.[0]?.value

    // Extract bio
    const bio = contact.biographies?.[0]?.value

    // Extract photo
    const avatarUrl = contact.photos?.[0]?.url

    // Extract social profiles from URLs
    const socialProfiles: Record<string, string> = {}
    contact.urls?.forEach(url => {
      if (url.value.includes('linkedin.com')) {
        socialProfiles.linkedin = url.value
      } else if (url.value.includes('twitter.com')) {
        socialProfiles.twitter = url.value
      } else if (url.value.includes('github.com')) {
        socialProfiles.github = url.value
      }
    })

    await db.insert(contacts)
      .values({
        id: randomUUID(),
        userId: config.userId,
        email: primaryEmail,
        name: displayName,
        firstName,
        lastName,
        phone,
        company,
        jobTitle,
        avatarUrl,
        notes: bio,
        socialProfiles,
        source,
        sourceAccountId: config.accountId,
        relationshipStrength: 0,
        interactionCount: 0,
        tags: [],
        customFields: {},
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: [contacts.userId, contacts.email],
        set: {
          name: displayName,
          firstName,
          lastName,
          phone,
          company,
          jobTitle,
          avatarUrl,
          notes: bio,
          socialProfiles,
          updatedAt: new Date()
        }
      })
  }

  private async extractContactsFromEmails(config: SyncConfig) {
    // Get unique email addresses from recent emails
    const recentEmails = await db.query.emails.findMany({
      where: and(
        eq(emails.userId, config.userId),
        eq(emails.accountId, config.accountId)
      ),
      orderBy: [desc(emails.receivedAt)],
      limit: 1000
    })

    const emailAddresses = new Set<string>()
    const emailToName = new Map<string, string>()

    for (const email of recentEmails) {
      // Extract from sender
      if (email.from && typeof email.from === 'object' && 'email' in email.from) {
        const from = email.from as { email: string; name?: string }
        emailAddresses.add(from.email)
        if (from.name) {
          emailToName.set(from.email, from.name)
        }
      }

      // Extract from recipients
      const recipients = [
        ...(email.to as any[] || []),
        ...(email.cc as any[] || [])
      ]
      
      for (const recipient of recipients) {
        if (recipient.email) {
          emailAddresses.add(recipient.email)
          if (recipient.name) {
            emailToName.set(recipient.email, recipient.name)
          }
        }
      }
    }

    // Check which contacts already exist
    const existingContacts = await db.query.contacts.findMany({
      where: and(
        eq(contacts.userId, config.userId),
        inArray(contacts.email, Array.from(emailAddresses))
      )
    })

    const existingEmails = new Set(existingContacts.map(c => c.email))

    // Create new contacts from email addresses
    const newContacts = Array.from(emailAddresses)
      .filter(email => !existingEmails.has(email))
      .map(email => ({
        id: randomUUID(),
        userId: config.userId,
        email,
        name: emailToName.get(email) || email,
        source: 'gmail' as const,
        sourceAccountId: config.accountId,
        relationshipStrength: 0,
        interactionCount: 0,
        tags: [],
        socialProfiles: {},
        customFields: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }))

    if (newContacts.length > 0) {
      await db.insert(contacts).values(newContacts)
    }

    // Update interaction counts for all contacts
    await this.updateInteractionCounts(config)
  }

  private async updateInteractionCounts(config: SyncConfig) {
    // This would be better done with a SQL query but for now we'll do it in code
    const allContacts = await db.query.contacts.findMany({
      where: eq(contacts.userId, config.userId)
    })

    for (const contact of allContacts) {
      // Count emails from/to this contact
      const emailCount = await db.query.emails.findMany({
        where: and(
          eq(emails.userId, config.userId),
          eq(emails.accountId, config.accountId)
        )
      })

      let interactionCount = 0
      let lastInteractionAt: Date | null = null

      for (const email of emailCount) {
        const from = email.from as { email: string } | null
        const recipients = [
          ...(email.to as any[] || []),
          ...(email.cc as any[] || [])
        ]

        if (from?.email === contact.email || recipients.some(r => r.email === contact.email)) {
          interactionCount++
          if (!lastInteractionAt || (email.receivedAt && email.receivedAt > lastInteractionAt)) {
            lastInteractionAt = email.receivedAt
          }
        }
      }

      // Calculate relationship strength (0-100 based on interaction count)
      const relationshipStrength = Math.min(interactionCount * 2, 100)

      await db.update(contacts)
        .set({
          interactionCount,
          relationshipStrength,
          lastInteractionAt,
          updatedAt: new Date()
        })
        .where(eq(contacts.id, contact.id))
    }
  }

  private async getSyncJobFailedCount(): Promise<number> {
    if (!this.syncJobId) return 0
    
    const job = await db.query.syncJobs.findFirst({
      where: eq(syncJobs.id, this.syncJobId)
    })
    
    return job?.failedItems || 0
  }
}