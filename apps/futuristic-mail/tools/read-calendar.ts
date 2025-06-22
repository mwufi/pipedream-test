import { z } from 'zod';
import { tool } from 'ai';
import { db } from '@/lib/db';
import { calendarEvents, accounts } from '@/lib/db/schema';
import { desc, eq, and, or, ilike, sql, gte, lte } from 'drizzle-orm';

export const createReadCalendarEventsTool = (userId: string) => tool({
  description: 'Read calendar events from the user\'s calendar. Can search by text and filter by date range. If no date range is specified, defaults to the next 7 days.',
  parameters: z.object({
    search: z.string().optional().describe('Search for events containing this text in title, description, or location'),
    limit: z.number().optional().default(20).describe('Maximum number of events to return (default: 20)'),
    startDate: z.string().optional().describe('Filter events starting after this date (ISO 8601 format). Leave empty to use today.'),
    endDate: z.string().optional().describe('Filter events starting before this date (ISO 8601 format). Leave empty to use 7 days from now.'),
    accountId: z.string().optional().describe('Filter by specific account ID (usually not needed)'),
  }),
  execute: async ({ search, limit, startDate, endDate, accountId }) => {
    // Default to next 7 days if no dates provided
    const now = new Date();
    const defaultStartDate = startDate || now.toISOString();
    const defaultEndDate = endDate || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    console.log('[readCalendarEventsTool] Starting execution', { 
      userId, 
      search, 
      limit, 
      startDate: defaultStartDate, 
      endDate: defaultEndDate, 
      accountId 
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

      // Build query conditions
      const conditions = [];
      
      // Account filter
      if (accountId) {
        conditions.push(eq(calendarEvents.accountId, accountId));
      } else {
        conditions.push(sql`${calendarEvents.accountId} IN (${sql.join(accountIds, sql`, `)})`);
      }

      // Search filter
      if (search) {
        conditions.push(or(
          ilike(calendarEvents.title, `%${search}%`),
          ilike(calendarEvents.description, `%${search}%`),
          ilike(calendarEvents.location, `%${search}%`)
        ));
      }

      // Date range filter - always apply defaults
      conditions.push(gte(calendarEvents.startTime, new Date(defaultStartDate)));
      conditions.push(lte(calendarEvents.startTime, new Date(defaultEndDate)));

      // Build and execute query
      let query = db.select({
        id: calendarEvents.id,
        title: calendarEvents.title,
        description: calendarEvents.description,
        location: calendarEvents.location,
        startTime: calendarEvents.startTime,
        endTime: calendarEvents.endTime,
        isAllDay: calendarEvents.isAllDay,
        status: calendarEvents.status,
        organizer: calendarEvents.organizer,
        attendees: calendarEvents.attendees,
        isRecurring: calendarEvents.isRecurring,
        recurringEventId: calendarEvents.recurringEventId,
        recurrenceRule: calendarEvents.recurrenceRule,
        aiSummary: calendarEvents.aiSummary,
        aiExtractedTopics: calendarEvents.aiExtractedTopics,
        createdAt: calendarEvents.createdAt,
        updatedAt: calendarEvents.updatedAt,
      })
      .from(calendarEvents)
      .where(and(...conditions))
      .orderBy(desc(calendarEvents.startTime))
      .limit(limit);

      const result = await query;
      console.log(`[readCalendarEventsTool] Found ${result.length} events`);
      return result;
    } catch (error) {
      console.error('[readCalendarEventsTool] Error:', error);
      throw error;
    }
  },
});