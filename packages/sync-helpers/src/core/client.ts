/**
 * Core Pipedream client wrapper
 */

import { createBackendClient, BackendClient } from '@pipedream/sdk/server';
import {
  SyncClientConfig,
  ProxyRequest,
  ProxyResponse,
  PipedreamAccount,
  FetchOptions
} from './types';
import {
  SyncError,
  RateLimitError,
  AuthenticationError,
  NetworkError,
  isRateLimitError,
  getRetryDelay
} from './errors';

export class SyncClient {
  private pdClient: BackendClient;
  
  constructor(private config: SyncClientConfig) {
    this.pdClient = createBackendClient({
      environment: config.pipedream.environment,
      projectId: config.pipedream.projectId,
      credentials: {
        clientId: config.pipedream.clientId,
        clientSecret: config.pipedream.clientSecret
      }
    });
  }

  /**
   * Get the underlying Pipedream client
   */
  get pipedreamClient(): BackendClient {
    return this.pdClient;
  }

  /**
   * Make a proxy request through Pipedream Connect
   */
  async makeProxyRequest<T = any>(
    request: ProxyRequest,
    options?: FetchOptions
  ): Promise<T> {
    const maxRetries = options?.maxRetries ?? 3;
    const initialDelay = options?.initialDelay ?? 1000;
    const maxDelay = options?.maxDelay ?? 60000;

    let lastError: any;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.pdClient.makeProxyRequest(
          {
            searchParams: {
              account_id: request.accountId,
              external_user_id: request.externalUserId
            }
          },
          {
            url: request.targetUrl,
            options: request.options || {}
          }
        );

        // Unwrap the proxy response
        return this.unwrapProxyResponse<T>(response);
      } catch (error: any) {
        lastError = error;

        // Check if it's a rate limit error
        if (isRateLimitError(error)) {
          const retryDelay = getRetryDelay(error) || delay;
          
          if (attempt < maxRetries) {
            await this.sleep(Math.min(retryDelay, maxDelay));
            delay = Math.min(delay * 2, maxDelay); // Exponential backoff
            continue;
          }
          
          throw new RateLimitError(
            'pipedream',
            Math.ceil(retryDelay / 1000),
            error
          );
        }

        // Check for authentication errors
        if (error.status === 401 || error.status === 403) {
          throw new AuthenticationError(
            'pipedream',
            error.message || 'Authentication failed',
            error
          );
        }

        // Check for retryable errors
        if (this.isRetryableError(error) && attempt < maxRetries) {
          await this.sleep(delay);
          delay = Math.min(delay * 2, maxDelay);
          continue;
        }

        // Non-retryable error or max retries reached
        throw new NetworkError(
          'pipedream',
          error.message || 'Network request failed',
          error
        );
      }
    }

    // This should never be reached, but just in case
    throw lastError;
  }

  /**
   * Get user accounts from Pipedream
   */
  async getUserAccounts(
    externalUserId: string,
    appNameSlug?: string
  ): Promise<PipedreamAccount[]> {
    try {
      const response = await this.pdClient.getAccounts({
        external_user_id: externalUserId
      });

      let accounts = response.data || [];

      // Filter by app if specified
      if (appNameSlug) {
        accounts = accounts.filter(
          account => account.app.name_slug === appNameSlug
        );
      }

      return accounts;
    } catch (error: any) {
      throw new SyncError(
        `Failed to fetch user accounts: ${error.message}`,
        'ACCOUNTS_FETCH_FAILED',
        false,
        'pipedream',
        error
      );
    }
  }

  /**
   * Unwrap proxy response to get the actual data
   */
  private unwrapProxyResponse<T>(response: any): T {
    // Handle the proxy response wrapper format
    if (response && typeof response === 'object') {
      // If it has the proxy wrapper structure
      if ('status' in response && 'statusText' in response && 'data' in response) {
        // Check for error status codes
        if (response.status >= 400) {
          const error: any = new Error(
            response.data?.error?.message || 
            response.statusText || 
            `Request failed with status ${response.status}`
          );
          error.status = response.status;
          error.statusText = response.statusText;
          error.headers = response.headers;
          error.data = response.data;
          throw error;
        }
        
        return response.data as T;
      }
    }
    
    // If it's not wrapped, return as-is
    return response as T;
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    // Network errors
    if (error.code === 'ECONNRESET' || 
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENOTFOUND') {
      return true;
    }

    // Server errors
    if (error.status >= 500 && error.status < 600) {
      return true;
    }

    // Rate limits are handled separately
    if (isRateLimitError(error)) {
      return true;
    }

    return false;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Create a sync client instance
 */
export function createSyncClient(config: SyncClientConfig): SyncClient {
  return new SyncClient(config);
}