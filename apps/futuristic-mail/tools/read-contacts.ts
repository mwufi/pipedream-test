import { z } from 'zod';
import { tool } from 'ai';
import { db } from '@/lib/db';
import { contacts } from '@/lib/db/schema';
import { desc, eq, and, or, ilike } from 'drizzle-orm';

export const createReadContactsTool = (userId: string) => tool({
  description: 'Read contacts from the user\'s contact list. Returns contacts sorted by last interaction. Can search by name, email, or company.',
  parameters: z.object({
    search: z.string().optional().describe('Search for contacts by name, email, or company'),
    limit: z.number().optional().default(20).describe('Maximum number of contacts to return (default: 20, max: 100)'),
  }),
  execute: async ({ search, limit }) => {
    // Enforce reasonable limit
    const safeLimit = Math.min(limit || 20, 100);
    
    console.log('[readContactsTool] Starting execution', { 
      userId, 
      search: search || 'none', 
      limit: safeLimit
    });
    
    try {
      if (!userId) {
        throw new Error('User ID not provided');
      }

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
          eq(contacts.userId, userId),
          search ? or(
            ilike(contacts.name, `%${search}%`),
            ilike(contacts.email, `%${search}%`),
            ilike(contacts.company, `%${search}%`)
          ) : undefined
        )
      )
      .orderBy(desc(contacts.lastInteractionAt))
      .limit(safeLimit);

      console.log('[readContactsTool] Executing query...');
      const result = await query;
      console.log(`[readContactsTool] Query complete. Found ${result.length} contacts`);
      
      // Return simplified data to avoid serialization issues
      return result.map(contact => ({
        id: contact.id,
        email: contact.email || '',
        name: contact.name || '',
        firstName: contact.firstName || '',
        lastName: contact.lastName || '',
        company: contact.company || '',
        jobTitle: contact.jobTitle || '',
        phone: contact.phone || '',
      }));
    } catch (error) {
      console.error('[readContactsTool] Error details:', {
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