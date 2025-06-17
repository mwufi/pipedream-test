/**
 * Custom error classes for sync-helpers
 */

export class SyncError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean,
    public provider: string,
    public details?: any
  ) {
    super(message);
    this.name = 'SyncError';
  }
}

export class RateLimitError extends SyncError {
  constructor(
    provider: string,
    public retryAfter?: number,
    details?: any
  ) {
    super(
      `Rate limit exceeded for ${provider}`,
      'RATE_LIMIT_EXCEEDED',
      true,
      provider,
      details
    );
    this.name = 'RateLimitError';
  }
}

export class AuthenticationError extends SyncError {
  constructor(
    provider: string,
    message: string = 'Authentication failed',
    details?: any
  ) {
    super(
      message,
      'AUTHENTICATION_FAILED',
      false,
      provider,
      details
    );
    this.name = 'AuthenticationError';
  }
}

export class AccountNotFoundError extends SyncError {
  constructor(
    provider: string,
    accountId: string,
    details?: any
  ) {
    super(
      `Account ${accountId} not found for ${provider}`,
      'ACCOUNT_NOT_FOUND',
      false,
      provider,
      details
    );
    this.name = 'AccountNotFoundError';
  }
}

export class NetworkError extends SyncError {
  constructor(
    provider: string,
    message: string,
    details?: any
  ) {
    super(
      message,
      'NETWORK_ERROR',
      true,
      provider,
      details
    );
    this.name = 'NetworkError';
  }
}

/**
 * Check if an error indicates rate limiting
 */
export function isRateLimitError(error: any): boolean {
  if (error instanceof RateLimitError) {
    return true;
  }
  
  // Check for common rate limit indicators
  if (error.status === 429) {
    return true;
  }
  
  if (error.message?.toLowerCase().includes('rate limit')) {
    return true;
  }
  
  if (error.error?.errors?.[0]?.reason === 'rateLimitExceeded') {
    return true;
  }
  
  return false;
}

/**
 * Extract retry delay from error
 */
export function getRetryDelay(error: any): number | undefined {
  if (error instanceof RateLimitError && error.retryAfter) {
    return error.retryAfter * 1000; // Convert to milliseconds
  }
  
  // Check Retry-After header
  if (error.headers?.['retry-after']) {
    const retryAfter = error.headers['retry-after'];
    // If it's a number, it's delay in seconds
    if (!isNaN(Number(retryAfter))) {
      return Number(retryAfter) * 1000;
    }
    // If it's a date, calculate delay
    const retryDate = new Date(retryAfter);
    if (!isNaN(retryDate.getTime())) {
      return Math.max(0, retryDate.getTime() - Date.now());
    }
  }
  
  return undefined;
}