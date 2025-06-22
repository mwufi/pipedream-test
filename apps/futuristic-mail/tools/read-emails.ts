import { z } from 'zod';
import { tool } from 'ai';
import { db } from '@/lib/db';
import { emails, accounts } from '@/lib/db/schema';
import { desc, eq, and, or, ilike, sql } from 'drizzle-orm';

export const createReadEmailsTool = (userId: string) => tool({
  description: 'Read emails from the user\'s inbox. Returns recent emails sorted by date. Can search by keyword.',
  parameters: z.object({
    search: z.string().optional().describe('Search for emails containing this text in subject, snippet, or from address'),
    limit: z.number().optional().default(10).describe('Maximum number of emails to return (default: 10, max: 50)'),
    accountId: z.string().optional().describe('Filter by specific account ID (usually not needed)'),
  }),
  execute: async ({ search, limit, accountId }) => {
    // Enforce reasonable limit
    const safeLimit = Math.min(limit || 10, 50);
    
    console.log('[readEmailsTool] Starting execution', { 
      userId, 
      search: search || 'none', 
      limit: safeLimit, 
      accountId: accountId || 'all accounts' 
    });
    
    try {
      if (!userId) {
        throw new Error('User ID not provided');
      }

      // Get user's accounts
      const userAccounts = await db.select({ id: accounts.id })
        .from(accounts)
        .where(eq(accounts.userId, userId));

      if (userAccounts.length === 0) {
        return [];
      }

      const accountIds = userAccounts.map(acc => acc.id);

      // Build query
      let query = db.select({
        id: emails.id,
        subject: emails.subject,
        snippet: emails.snippet,
        from: emails.from,
        to: emails.to,
        cc: emails.cc,
        bcc: emails.bcc,
        date: emails.createdAt,
        isRead: emails.isRead,
        isStarred: emails.isStarred,
        labels: emails.labels,
        threadId: emails.threadId,
        aiSummary: emails.aiSummary,
      })
      .from(emails)
      .where(
        and(
          accountId ? eq(emails.accountId, accountId) : sql`${emails.accountId} IN (${sql.join(accountIds, sql`, `)})`,
          search ? or(
            ilike(emails.subject, `%${search}%`),
            ilike(emails.snippet, `%${search}%`),
            ilike(emails.from, `%${search}%`)
          ) : undefined
        )
      )
      .orderBy(desc(emails.createdAt))
      .limit(safeLimit);

      const result = await query;
      console.log(`[readEmailsTool] Found ${result.length} emails`);
      return result;
    } catch (error) {
      console.error('[readEmailsTool] Error:', error);
      throw error;
    }
  },
});