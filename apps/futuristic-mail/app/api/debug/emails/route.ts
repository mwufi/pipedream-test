import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { emails } from "@/lib/db/schema";
import { eq, desc, sql, and, gte, lte, or, ilike } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const category = searchParams.get("category");
    const includeStats = searchParams.get("stats") === "true";
    
    const offset = (page - 1) * limit;

    // Build filters
    const filters = [eq(emails.userId, userId)];
    
    if (search) {
      filters.push(
        or(
          ilike(emails.subject, `%${search}%`),
          ilike(emails.snippet, `%${search}%`),
          sql`${emails.from}->>'email' ILIKE ${`%${search}%`}`
        )
      );
    }
    
    if (startDate) {
      filters.push(gte(emails.receivedAt, new Date(startDate)));
    }
    
    if (endDate) {
      filters.push(lte(emails.receivedAt, new Date(endDate)));
    }
    
    if (category) {
      filters.push(eq(emails.category, category as any));
    }

    // Get paginated emails
    const [emailsData, totalCountResult] = await Promise.all([
      db
        .select()
        .from(emails)
        .where(and(...filters))
        .orderBy(desc(emails.receivedAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql`count(*)::int` })
        .from(emails)
        .where(and(...filters))
    ]);

    const totalCount = totalCountResult[0].count;
    const totalPages = Math.ceil(totalCount / limit);

    // Get stats if requested
    let stats = null;
    if (includeStats) {
      const [dateRange, categoryCounts, topSenders, monthlyStats] = await Promise.all([
        // Date range
        db
          .select({
            earliest: sql`MIN(${emails.receivedAt})`,
            latest: sql`MAX(${emails.receivedAt})`
          })
          .from(emails)
          .where(eq(emails.userId, userId)),
        
        // Category distribution
        db
          .select({
            category: emails.category,
            count: sql`count(*)::int`
          })
          .from(emails)
          .where(eq(emails.userId, userId))
          .groupBy(emails.category),
        
        // Top senders
        db
          .select({
            sender: sql`${emails.from}->>'email'`,
            name: sql`${emails.from}->>'name'`,
            count: sql`count(*)::int`
          })
          .from(emails)
          .where(eq(emails.userId, userId))
          .groupBy(sql`${emails.from}->>'email'`, sql`${emails.from}->>'name'`)
          .orderBy(desc(sql`count(*)`))
          .limit(10),
        
        // Monthly email count
        db
          .select({
            month: sql`TO_CHAR(${emails.receivedAt}, 'YYYY-MM')`,
            count: sql`count(*)::int`
          })
          .from(emails)
          .where(eq(emails.userId, userId))
          .groupBy(sql`TO_CHAR(${emails.receivedAt}, 'YYYY-MM')`)
          .orderBy(sql`TO_CHAR(${emails.receivedAt}, 'YYYY-MM')`)
      ]);

      stats = {
        dateRange: dateRange[0],
        totalEmails: totalCount,
        categoryDistribution: categoryCounts,
        topSenders,
        monthlyDistribution: monthlyStats,
        averagePerDay: totalCount / Math.max(1, 
          Math.ceil(
            (new Date(dateRange[0].latest).getTime() - new Date(dateRange[0].earliest).getTime()) / 
            (1000 * 60 * 60 * 24)
          )
        )
      };
    }

    return NextResponse.json({
      emails: emailsData,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore: page < totalPages
      },
      stats
    });
  } catch (error) {
    console.error("Error fetching emails for debug:", error);
    return NextResponse.json(
      { error: "Failed to fetch emails" },
      { status: 500 }
    );
  }
}