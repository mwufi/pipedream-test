// Rate limiting utilities based on patterns from Nimbus/Analog

export interface RateLimiterOptions {
  maxRetries?: number
  initialRetryDelay?: number
  maxRetryDelay?: number
  timeout?: number
}

export class GoogleAPIClient {
  private maxRetries: number
  private initialRetryDelay: number
  private maxRetryDelay: number
  private timeout: number

  constructor(options: RateLimiterOptions = {}) {
    this.maxRetries = options.maxRetries ?? 2
    this.initialRetryDelay = options.initialRetryDelay ?? 500
    this.maxRetryDelay = options.maxRetryDelay ?? 8000
    this.timeout = options.timeout ?? 60000
  }

  async makeRequest<T>(
    requestFn: () => Promise<T>,
    retryCount = 0
  ): Promise<T> {
    try {
      // Add timeout wrapper
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), this.timeout)
      })

      const result = await Promise.race([
        requestFn(),
        timeoutPromise
      ])

      return result as T
    } catch (error: any) {
      if (!this.shouldRetry(error, retryCount)) {
        throw error
      }

      const delay = this.calculateRetryDelay(retryCount, error)
      await this.sleep(delay)
      
      return this.makeRequest(requestFn, retryCount + 1)
    }
  }

  private shouldRetry(error: any, retryCount: number): boolean {
    if (retryCount >= this.maxRetries) return false
    
    const status = error.response?.status || error.status
    const retryableStatuses = [408, 409, 429, 500, 502, 503, 504]
    
    return retryableStatuses.includes(status) || error.message === 'Request timeout'
  }

  private calculateRetryDelay(retryCount: number, error: any): number {
    // Check for Retry-After header
    const retryAfter = error.response?.headers?.['retry-after'] || error.headers?.['retry-after']
    if (retryAfter) {
      return parseInt(retryAfter) * 1000
    }

    // Exponential backoff with jitter
    const baseDelay = Math.min(
      this.initialRetryDelay * Math.pow(2, retryCount),
      this.maxRetryDelay
    )
    
    // Add jitter (up to 25% variation)
    return baseDelay * (1 - Math.random() * 0.25)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Local token bucket implementation for rate limiting
export class TokenBucket {
  private tokens: number
  private lastRefill: number
  
  constructor(
    private capacity: number,
    private refillRate: number // tokens per second
  ) {
    this.tokens = capacity
    this.lastRefill = Date.now()
  }

  async wait(tokensNeeded = 1): Promise<void> {
    while (true) {
      this.refill()
      
      if (this.tokens >= tokensNeeded) {
        this.tokens -= tokensNeeded
        return
      }

      // Calculate wait time
      const tokensShort = tokensNeeded - this.tokens
      const waitMs = (tokensShort / this.refillRate) * 1000
      
      await new Promise(resolve => setTimeout(resolve, waitMs))
    }
  }

  private refill(): void {
    const now = Date.now()
    const elapsed = (now - this.lastRefill) / 1000
    const tokensToAdd = elapsed * this.refillRate
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd)
    this.lastRefill = now
  }
}

// Simple chunk processor for batch operations
export class ChunkProcessor {
  constructor(
    private chunkSize = 15,
    private delayBetweenChunks = 100 // ms
  ) {}

  async processInChunks<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>
  ): Promise<R[]> {
    const results: R[] = []

    for (let i = 0; i < items.length; i += this.chunkSize) {
      const chunk = items.slice(i, i + this.chunkSize)
      
      const chunkResults = await Promise.all(
        chunk.map(item => processor(item))
      )
      
      results.push(...chunkResults)

      // Add delay between chunks except for the last one
      if (i + this.chunkSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, this.delayBetweenChunks))
      }
    }

    return results
  }
}