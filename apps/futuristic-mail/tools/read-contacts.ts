import { z } from 'zod';
import { tool } from 'ai';
import { db } from '@/lib/db';
import { contacts, accounts } from '@/lib/db/schema';
import { desc, eq, and, or, ilike, sql } from 'drizzle-orm';

export const createReadContactsTool = (userId: string) => tool({
  description: 'Read contacts from the user\'s contact list. Returns contacts sorted by last interaction. Can search by name, email, or company.',
  parameters: z.object({
    search: z.string().optional().describe('Search for contacts by name, email, or company'),
    limit: z.number().optional().default(20).describe('Maximum number of contacts to return (default: 20, max: 100)'),
    accountId: z.string().optional().describe('Filter by specific account ID (usually not needed)'),
  }),
  execute: async ({ search, limit, accountId }) => {
    // Enforce reasonable limit
    const safeLimit = Math.min(limit || 20, 100);
    
    console.log('[readContactsTool] Starting execution', { 
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
        id: contacts.id,
        email: contacts.email,
        name: contacts.name,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        phone: contacts.phone,
        company: contacts.company,
        jobTitle: contacts.jobTitle,
        notes: contacts.notes,
        relationshipStrength: contacts.relationshipStrength,
        lastInteractionAt: contacts.lastInteractionAt,
        interactionCount: contacts.interactionCount,
        tags: contacts.tags,
        source: contacts.source,
        createdAt: contacts.createdAt,
        updatedAt: contacts.updatedAt,
      })
      .from(contacts)
      .where(
        and(
          accountId ? eq(contacts.accountId, accountId) : sql`${contacts.accountId} IN (${sql.join(accountIds, sql`, `)})`,
          search ? or(
            ilike(contacts.name, `%${search}%`),
            ilike(contacts.email, `%${search}%`),
            ilike(contacts.company, `%${search}%`)
          ) : undefined
        )
      )
      .orderBy(desc(contacts.lastInteractionAt))
      .limit(safeLimit);

      const result = await query;
      console.log(`[readContactsTool] Found ${result.length} contacts`);
      return result;
    } catch (error) {
      console.error('[readContactsTool] Error:', error);
      throw error;
    }
  },
});