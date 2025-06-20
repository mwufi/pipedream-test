import { BaseSyncService, SyncConfig } from './base-sync-service'
import { db, emails, threads, accounts, syncJobs } from '@/lib/db'
import { eq, and, desc } from 'drizzle-orm'
import { randomUUID } from 'crypto'

interface GmailMessage {
  id: string
  threadId: string
  labelIds?: string[]
  snippet: string
  payload: {
    headers: Array<{ name: string; value: string }>
    body?: { data?: string }
    parts?: Array<{
      mimeType: string
      body?: { data?: string }
    }>
  }
  internalDate: string
}

interface GmailThread {
  id: string
  messages: GmailMessage[]
}

export class GmailSyncService extends BaseSyncService {
  async sync(config: SyncConfig) {
    try {
      await this.createSyncJob(config)
      await this.updateSyncJob({ 
        status: 'processing',
        startedAt: new Date()
      })

      // Get the account's sync state
      const account = await db.query.accounts.findFirst({
        where: eq(accounts.id, config.accountId)
      })

      if (!account) {
        throw new Error('Account not found')
      }

      const syncState = account.syncState as { historyId?: string, lastSync?: string } || {}
      const lastHistoryId = syncState.historyId
      const lastSync = syncState.lastSync ? new Date(syncState.lastSync) : null

      // Determine sync strategy
      if (lastHistoryId && lastSync) {
        // Use incremental sync with history API
        console.log(`Using incremental sync from history ID: ${lastHistoryId}`)
        await this.incrementalSync(config, lastHistoryId)
      } else {
        // Initial sync or fallback to date-based sync
        console.log('Performing initial sync (last month)')
        const oneMonthAgo = new Date()
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
        const dateQuery = `after:${Math.floor(oneMonthAgo.getTime() / 1000)}`
        await this.syncThreads(config, dateQuery)
      }

      // Get the latest history ID for next sync
      const latestHistoryId = await this.getLatestHistoryId(config)

      // Update last synced timestamp and history ID
      await db.update(accounts)
        .set({ 
          lastSyncedAt: new Date(),
          syncState: { 
            historyId: latestHistoryId,
            lastSync: new Date().toISOString()
          }
        })
        .where(eq(accounts.id, config.accountId))

      await this.updateSyncJob({ 
        status: 'completed',
        completedAt: new Date()
      })
    } catch (error) {
      console.error('Gmail sync failed:', error)
      await this.updateSyncJob({ 
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date()
      })
      throw error
    }
  }

  private async syncThreads(config: SyncConfig, query: string) {
    let pageToken: string | undefined
    let totalThreads = 0
    let processedThreads = 0

    do {
      // Rate limit the list request
      await this.rateLimiter.wait(5)

      const response = await this.apiClient.makeRequest(() =>
        this.fetchWithPipedreamProxy(
          config.pipedreamAccountId,
          `https://gmail.googleapis.com/gmail/v1/users/me/threads?q=${encodeURIComponent(query)}&maxResults=50${
            pageToken ? `&pageToken=${pageToken}` : ''
          }`,
          undefined,
          config.userId
        )
      )

      const threadList = response.threads || []
      totalThreads += threadList.length
      
      await this.updateSyncJob({ totalItems: totalThreads })

      // Process threads in batches
      for (const threadSummary of threadList) {
        try {
          await this.syncSingleThread(config, threadSummary.id)
          processedThreads++
          console.log(`Processed ${processedThreads} threads`)
          if(processedThreads % 10 === 0) {
            await this.updateSyncJob({ processedItems: processedThreads })
          }
        } catch (error) {
          console.error(`Failed to sync thread ${threadSummary.id}:`, error)
          await this.updateSyncJob({ 
            failedItems: (await this.getSyncJobFailedCount()) + 1 
          })
        }
      }

      pageToken = response.nextPageToken
    } while (pageToken)
  }

  private async syncSingleThread(config: SyncConfig, threadId: string) {
    // Rate limit the thread request
    await this.rateLimiter.wait(2)

    const threadData: GmailThread = await this.apiClient.makeRequest(() =>
      this.fetchWithPipedreamProxy(
        config.pipedreamAccountId,
        `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=full`,
        undefined,
        config.userId
      )
    )

    if (!threadData.messages || threadData.messages.length === 0) {
      return
    }

    // Extract thread metadata
    const firstMessage = threadData.messages[0]
    const lastMessage = threadData.messages[threadData.messages.length - 1]
    const threadHeaders = this.extractHeaders(firstMessage.payload.headers)
    
    // Get all unique participants
    const participants = new Set<string>()
    const allLabels = new Set<string>()
    let hasAttachments = false
    let isRead = true
    let isStarred = false
    let isImportant = false

    // Process all messages in the thread
    for (const message of threadData.messages) {
      const headers = this.extractHeaders(message.payload.headers)
      
      // Add participants
      if (headers.from) participants.add(headers.from)
      if (headers.to) headers.to.split(',').forEach(e => participants.add(e.trim()))
      if (headers.cc) headers.cc.split(',').forEach(e => participants.add(e.trim()))
      
      // Collect labels
      message.labelIds?.forEach(label => allLabels.add(label))
      
      // Check flags
      if (message.labelIds?.includes('UNREAD')) isRead = false
      if (message.labelIds?.includes('STARRED')) isStarred = true
      if (message.labelIds?.includes('IMPORTANT')) isImportant = true
      
      // Check for attachments
      if (message.payload.parts?.some(part => part.mimeType.startsWith('application/'))) {
        hasAttachments = true
      }
    }

    // Upsert thread
    const threadDbId = randomUUID()
    await db.insert(threads)
      .values({
        id: threadDbId,
        userId: config.userId,
        accountId: config.accountId,
        gmailThreadId: threadId,
        subject: threadHeaders.subject || '(no subject)',
        snippet: firstMessage.snippet,
        participants: Array.from(participants).map(email => {
          const match = email.match(/(?:"?([^"]*)"?\s)?<?(.+@.+)>?/)
          return {
            email: match ? match[2] : email,
            name: match ? match[1] : undefined
          }
        }),
        messageCount: threadData.messages.length,
        hasAttachments,
        isRead,
        isStarred,
        isImportant,
        labels: Array.from(allLabels),
        lastMessageAt: new Date(parseInt(lastMessage.internalDate)),
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: [threads.gmailThreadId, threads.accountId],
        set: {
          subject: threadHeaders.subject || '(no subject)',
          snippet: firstMessage.snippet,
          participants: Array.from(participants).map(email => {
            const match = email.match(/(?:"?([^"]*)"?\s)?<?(.+@.+)>?/)
            return {
              email: match ? match[2] : email,
              name: match ? match[1] : undefined
            }
          }),
          messageCount: threadData.messages.length,
          hasAttachments,
          isRead,
          isStarred,
          isImportant,
          labels: Array.from(allLabels),
          lastMessageAt: new Date(parseInt(lastMessage.internalDate)),
          updatedAt: new Date()
        }
      })

    // Get the thread ID for foreign key reference
    const dbThread = await db.query.threads.findFirst({
      where: and(
        eq(threads.gmailThreadId, threadId),
        eq(threads.accountId, config.accountId)
      )
    })

    if (!dbThread) {
      throw new Error('Failed to create/update thread')
    }

    // Sync individual messages
    for (const message of threadData.messages) {
      await this.syncMessage(config, message, dbThread.id)
    }
  }

  private async syncMessage(config: SyncConfig, message: GmailMessage, threadId: string) {
    const headers = this.extractHeaders(message.payload.headers)
    const { textBody, htmlBody } = this.extractBody(message.payload)
    
    // Parse from/to/cc/bcc addresses
    const parseAddress = (addr: string) => {
      const match = addr.match(/(?:"?([^"]*)"?\s)?<?(.+@.+)>?/)
      return {
        email: match ? match[2] : addr,
        name: match ? match[1] : undefined
      }
    }

    const from = headers.from ? parseAddress(headers.from) : { email: 'unknown@unknown.com' }
    const to = headers.to ? headers.to.split(',').map(e => parseAddress(e.trim())) : []
    const cc = headers.cc ? headers.cc.split(',').map(e => parseAddress(e.trim())) : []
    const bcc = headers.bcc ? headers.bcc.split(',').map(e => parseAddress(e.trim())) : []

    // Extract attachments info
    const attachments = message.payload.parts
      ?.filter(part => part.mimeType.startsWith('application/') || part.mimeType.startsWith('image/'))
      ?.map(part => ({
        mimeType: part.mimeType,
        filename: part.filename || 'attachment'
      })) || []

    await db.insert(emails)
      .values({
        id: randomUUID(),
        userId: config.userId,
        accountId: config.accountId,
        gmailId: message.id,
        threadId,
        subject: headers.subject || '(no subject)',
        snippet: message.snippet,
        body: textBody,
        htmlBody,
        from,
        to,
        cc,
        bcc,
        category: this.categorizeEmail(message.labelIds),
        labels: message.labelIds || [],
        isRead: !message.labelIds?.includes('UNREAD'),
        isStarred: message.labelIds?.includes('STARRED') || false,
        isImportant: message.labelIds?.includes('IMPORTANT') || false,
        hasAttachments: attachments.length > 0,
        attachments,
        sentAt: headers.date ? new Date(headers.date) : undefined,
        receivedAt: new Date(parseInt(message.internalDate)),
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: [emails.gmailId, emails.accountId],
        set: {
          subject: headers.subject || '(no subject)',
          snippet: message.snippet,
          body: textBody,
          htmlBody,
          from,
          to,
          cc,
          bcc,
          category: this.categorizeEmail(message.labelIds),
          labels: message.labelIds || [],
          isRead: !message.labelIds?.includes('UNREAD'),
          isStarred: message.labelIds?.includes('STARRED') || false,
          isImportant: message.labelIds?.includes('IMPORTANT') || false,
          hasAttachments: attachments.length > 0,
          attachments,
          updatedAt: new Date()
        }
      })
  }

  private extractHeaders(headers: Array<{ name: string; value: string }>) {
    const headerMap: Record<string, string> = {}
    headers.forEach(h => {
      headerMap[h.name.toLowerCase()] = h.value
    })
    return {
      subject: headerMap['subject'],
      from: headerMap['from'],
      to: headerMap['to'],
      cc: headerMap['cc'],
      bcc: headerMap['bcc'],
      date: headerMap['date'],
      messageId: headerMap['message-id']
    }
  }

  private extractBody(payload: GmailMessage['payload']) {
    let textBody = ''
    let htmlBody = ''

    // Check direct body
    if (payload.body?.data) {
      textBody = Buffer.from(payload.body.data, 'base64').toString('utf-8')
    }

    // Check parts
    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          textBody = Buffer.from(part.body.data, 'base64').toString('utf-8')
        } else if (part.mimeType === 'text/html' && part.body?.data) {
          htmlBody = Buffer.from(part.body.data, 'base64').toString('utf-8')
        }
      }
    }

    return { textBody, htmlBody }
  }

  private categorizeEmail(labelIds?: string[]): 'inbox' | 'sent' | 'draft' | 'spam' | 'trash' {
    if (!labelIds) return 'inbox'
    
    if (labelIds.includes('SENT')) return 'sent'
    if (labelIds.includes('DRAFT')) return 'draft'
    if (labelIds.includes('SPAM')) return 'spam'
    if (labelIds.includes('TRASH')) return 'trash'
    
    return 'inbox'
  }

  private async getSyncJobFailedCount(): Promise<number> {
    if (!this.syncJobId) return 0
    
    const job = await db.query.syncJobs.findFirst({
      where: eq(syncJobs.id, this.syncJobId)
    })
    
    return job?.failedItems || 0
  }

  private async getLatestHistoryId(config: SyncConfig): Promise<string> {
    // Get the user's profile to get the latest history ID
    const profile = await this.apiClient.makeRequest(() =>
      this.fetchWithPipedreamProxy(
        config.pipedreamAccountId,
        'https://gmail.googleapis.com/gmail/v1/users/me/profile',
        undefined,
        config.userId
      )
    )
    
    return profile.historyId
  }

  private async incrementalSync(config: SyncConfig, startHistoryId: string) {
    let pageToken: string | undefined
    const affectedThreadIds = new Set<string>()
    
    do {
      // Rate limit the history request
      await this.rateLimiter.wait(5)
      
      const response = await this.apiClient.makeRequest(() =>
        this.fetchWithPipedreamProxy(
          config.pipedreamAccountId,
          `https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId=${startHistoryId}${
            pageToken ? `&pageToken=${pageToken}` : ''
          }`,
          undefined,
          config.userId
        )
      )
      
      if (response.history) {
        // Process history items
        for (const historyItem of response.history) {
          // Collect affected thread IDs from messages added, deleted, or modified
          if (historyItem.messagesAdded) {
            historyItem.messagesAdded.forEach((item: any) => {
              if (item.message?.threadId) {
                affectedThreadIds.add(item.message.threadId)
              }
            })
          }
          
          if (historyItem.messagesDeleted) {
            historyItem.messagesDeleted.forEach((item: any) => {
              if (item.message?.threadId) {
                affectedThreadIds.add(item.message.threadId)
              }
            })
          }
          
          if (historyItem.labelsAdded || historyItem.labelsRemoved) {
            const items = [...(historyItem.labelsAdded || []), ...(historyItem.labelsRemoved || [])]
            items.forEach((item: any) => {
              if (item.message?.threadId) {
                affectedThreadIds.add(item.message.threadId)
              }
            })
          }
        }
      }
      
      pageToken = response.nextPageToken
    } while (pageToken)
    
    // Sync affected threads
    console.log(`Found ${affectedThreadIds.size} affected threads to sync`)
    await this.updateSyncJob({ totalItems: affectedThreadIds.size })
    
    let processedThreads = 0
    for (const threadId of affectedThreadIds) {
      try {
        await this.syncSingleThread(config, threadId)
        processedThreads++
        await this.updateSyncJob({ processedItems: processedThreads })
      } catch (error) {
        console.error(`Failed to sync thread ${threadId}:`, error)
        await this.updateSyncJob({ 
          failedItems: (await this.getSyncJobFailedCount()) + 1 
        })
      }
    }
  }
}