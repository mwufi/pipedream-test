import * as restate from "@restatedev/restate-sdk";
import { Limiter } from "./ratelimit/limiter_client";
import { createSyncClient } from '@repo/sync-helpers';

// Initialize sync client once
const syncClient = createSyncClient({
  pipedream: {
    projectId: process.env.PIPEDREAM_PROJECT_ID || '',
    clientId: process.env.PIPEDREAM_CLIENT_ID || '',
    clientSecret: process.env.PIPEDREAM_CLIENT_SECRET || '',
    environment: (process.env.PIPEDREAM_ENVIRONMENT as 'development' | 'production') || 'development'
  }
});

export function fetchWithPipedreamProxy(input: {
  accountId: string,
  externalUserId: string,
  url: string,
  options?: any,
  rateLimiterKey?: string,
  tokensNeeded?: number
}) {
  try {
    return syncClient.makeProxyRequest({
      accountId: input.accountId,
      externalUserId: input.externalUserId,
      targetUrl: input.url,
      options: input.options || {}
    }, { maxRetries: 1 }); // Let Restate handle retries
  } catch (error) {
    console.error(`Error making API call: ${error}`);
    throw error;
  }
}

export const apiService = restate.service({
  name: "api",
  handlers: {
    fetch: async (ctx: restate.Context, req: {
      accountId: string,
      externalUserId: string,
      url: string,
      options?: any,
      rateLimiterKey?: string,
      tokensNeeded?: number
    }) => {
      // Apply rate limiting if configured
      if (req.rateLimiterKey) {
        const limiter = Limiter.fromContext(ctx, req.rateLimiterKey);
        console.log(`[${req.rateLimiterKey}] Waiting for ${req.tokensNeeded} tokens`);
        await limiter.wait(req.tokensNeeded || 1, 500);
        console.log(`[${req.rateLimiterKey}] Waited for ${req.tokensNeeded} tokens`);
      }

      // Make the API call with Restate's retry mechanism
      return syncClient.makeProxyRequest({
        accountId: req.accountId,
        externalUserId: req.externalUserId,
        targetUrl: req.url,
        options: req.options || {}
      }, { maxRetries: 1 }); // Let Restate handle retries
    }
  }
});