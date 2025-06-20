import { db, syncJobs, syncStatusEnum } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { GoogleAPIClient, TokenBucket } from '@/lib/utils/rate-limiter'
import { createSyncClient, SyncClient } from '@repo/sync-helpers'
import { randomUUID } from 'crypto'

export interface SyncConfig {
  userId: string
  accountId: string
  pipedreamAccountId: string
  type: 'email' | 'calendar' | 'contacts'
}

export abstract class BaseSyncService {
  protected apiClient: GoogleAPIClient
  protected rateLimiter: TokenBucket
  protected syncJobId?: string
  protected syncClient: SyncClient

  constructor() {
    // Use similar rate limits to what was in the restate implementation
    this.apiClient = new GoogleAPIClient({
      maxRetries: 2,
      initialRetryDelay: 500,
      maxRetryDelay: 8000,
      timeout: 60000
    })
    
    // 3 requests per second with burst of 12
    this.rateLimiter = new TokenBucket(12, 3)
    
    // Initialize sync client
    this.syncClient = createSyncClient({
      pipedream: {
        projectId: process.env.PIPEDREAM_PROJECT_ID || '',
        clientId: process.env.PIPEDREAM_CLIENT_ID || '',
        clientSecret: process.env.PIPEDREAM_CLIENT_SECRET || '',
        environment: (process.env.PIPEDREAM_ENVIRONMENT as 'development' | 'production') || 'development'
      }
    })
  }

  protected async createSyncJob(config: SyncConfig) {
    const id = randomUUID()
    
    await db.insert(syncJobs).values({
      id,
      userId: config.userId,
      accountId: config.accountId,
      type: config.type,
      status: 'pending',
      totalItems: 0,
      processedItems: 0,
      failedItems: 0,
      config: {},
      result: {}
    })
    
    this.syncJobId = id
    return id
  }

  protected async updateSyncJob(data: {
    status?: typeof syncStatusEnum.enumValues[number]
    totalItems?: number
    processedItems?: number
    failedItems?: number
    error?: string
    result?: any
    startedAt?: Date
    completedAt?: Date
  }) {
    if (!this.syncJobId) return
    
    await db.update(syncJobs)
      .set(data)
      .where(eq(syncJobs.id, this.syncJobId))
  }

  protected async fetchWithPipedreamProxy(
    accountId: string,
    url: string,
    options?: RequestInit,
    userId?: string
  ) {
    // Use Pipedream's proxy to make authenticated requests
    const response = await this.syncClient.makeProxyRequest({
      accountId,
      externalUserId: userId || 'system',
      targetUrl: url,
      options: {
        method: options?.method || 'GET',
        headers: options?.headers,
        body: options?.body
      }
    })
    
    return response
  }

  abstract sync(config: SyncConfig): Promise<void>
}