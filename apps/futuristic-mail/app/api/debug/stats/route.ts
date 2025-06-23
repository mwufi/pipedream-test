import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { emails, contacts, calendarEvents } from "@/lib/db/schema";
import { eq, sql, desc } from "drizzle-orm";

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get overall stats
    const [emailStats, contactStats, eventStats] = await Promise.all([
      // Email stats
      db
        .select({
          total: sql`count(*)::int`,
          unread: sql`count(*) FILTER (WHERE NOT ${emails.isRead})::int`,
          starred: sql`count(*) FILTER (WHERE ${emails.isStarred})::int`,
          withAttachments: sql`count(*) FILTER (WHERE ${emails.hasAttachments})::int`,
          earliest: sql`MIN(${emails.receivedAt})`,
          latest: sql`MAX(${emails.receivedAt})`
        })
        .from(emails)
        .where(eq(emails.userId, userId)),
      
      // Contact stats
      db
        .select({
          total: sql`count(*)::int`,
          withPhone: sql`count(*) FILTER (WHERE ${contacts.phone} IS NOT NULL)::int`,
          withCompany: sql`count(*) FILTER (WHERE ${contacts.company} IS NOT NULL)::int`,
          enriched: sql`count(*) FILTER (WHERE ${contacts.aiEnrichedData} IS NOT NULL)::int`,
          avgRelationshipStrength: sql`AVG(${contacts.relationshipStrength})::float`,
          totalInteractions: sql`SUM(${contacts.interactionCount})::int`
        })
        .from(contacts)
        .where(eq(contacts.userId, userId)),
      
      // Event stats
      db
        .select({
          total: sql`count(*)::int`,
          upcoming: sql`count(*) FILTER (WHERE ${calendarEvents.startTime} > NOW())::int`,
          past: sql`count(*) FILTER (WHERE ${calendarEvents.startTime} <= NOW())::int`,
          recurring: sql`count(*) FILTER (WHERE ${calendarEvents.isRecurring})::int`,
          withMeetingUrl: sql`count(*) FILTER (WHERE ${calendarEvents.meetingUrl} IS NOT NULL)::int`,
          earliest: sql`MIN(${calendarEvents.startTime})`,
          latest: sql`MAX(${calendarEvents.startTime})`
        })
        .from(calendarEvents)
        .where(eq(calendarEvents.userId, userId))
    ]);

    // Get email sentiment distribution
    const sentimentStats = await db
      .select({
        sentiment: emails.aiSentiment,
        count: sql`count(*)::int`
      })
      .from(emails)
      .where(eq(emails.userId, userId))
      .groupBy(emails.aiSentiment);

    // Get contact sources
    const contactSources = await db
      .select({
        source: contacts.source,
        count: sql`count(*)::int`
      })
      .from(contacts)
      .where(eq(contacts.userId, userId))
      .groupBy(contacts.source);

    // Get most active email domains
    const topDomains = await db
      .select({
        domain: sql`SUBSTRING(${emails.from}->>'email' FROM '@(.+)$')`,
        count: sql`count(*)::int`
      })
      .from(emails)
      .where(eq(emails.userId, userId))
      .groupBy(sql`SUBSTRING(${emails.from}->>'email' FROM '@(.+)$')`)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    return NextResponse.json({
      overview: {
        emails: emailStats[0],
        contacts: contactStats[0],
        events: eventStats[0]
      },
      emailInsights: {
        sentimentDistribution: sentimentStats,
        topDomains
      },
      contactInsights: {
        sourceDistribution: contactSources
      }
    });
  } catch (error) {
    console.error("Error fetching debug stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}