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
      console.log('[readEmailsTool] Fetching user accounts...');
      const userAccounts = await db.select({ id: accounts.id })
        .from(accounts)
        .where(eq(accounts.userId, userId));

      console.log(`[readEmailsTool] Found ${userAccounts.length} accounts`);

      if (userAccounts.length === 0) {
        console.log('[readEmailsTool] No accounts found, returning empty array');
        return [];
      }

      const accountIds = userAccounts.map(acc => acc.id);

      // Build query
      let query = db.select({
        id: emails.id,
        subject: emails.subject,
        snippet: emails.snippet,
        email_from: emails.from,
        to: emails.to,
        cc: emails.cc,
        bcc: emails.bcc,
        sentAt: emails.sentAt,
        receivedAt: emails.receivedAt,
        isRead: emails.isRead,
        isStarred: emails.isStarred,
        labels: emails.labels,
        threadId: emails.threadId,
        aiSummary: emails.aiSummary,
      })
        .from(emails)
        .where(
          and(
            accountId
              ? eq(emails.accountId, accountId)
              : sql`${emails.accountId} IN (${sql.join(accountIds.map(id => sql`${id}`), sql`, `)})`,
            search ? or(
              ilike(emails.subject, `%${search}%`),
              ilike(emails.snippet, `%${search}%`),
              ilike(emails.from, `%${search}%`)
            ) : undefined
          )
        )
        .orderBy(desc(emails.sentAt))
        .limit(safeLimit);

      console.log('[readEmailsTool] Query:', query.toSQL());

      console.log('[readEmailsTool] Executing query...');

      // Debug: Show the generated SQL
      const querySQL = query.toSQL();
      console.log('[readEmailsTool] Generated SQL:', querySQL.sql);
      console.log('[readEmailsTool] SQL Parameters:', querySQL.params);

      const result = await query;
      console.log(`[readEmailsTool] Query complete. Found ${result.length} emails`);

      // Return simplified data to avoid serialization issues
      return result.map(email => ({
        id: email.id,
        subject: email.subject || '',
        snippet: email.snippet || '',
        from: email.email_from || '',
        to: email.to || [],
        sentAt: email.sentAt,
        receivedAt: email.receivedAt,
        isRead: email.isRead,
        isStarred: email.isStarred,
      }));
    } catch (error) {
      console.error('[readEmailsTool] Error details:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        search,
        limit: safeLimit
      });

      // Return empty array instead of throwing to prevent UI stalls
      return [];
    }
  },
});