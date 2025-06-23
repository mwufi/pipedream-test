import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { calendarEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allEvents = await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.userId, userId))
      .orderBy(calendarEvents.startTime);

    return NextResponse.json(allEvents);
  } catch (error) {
    console.error("Error fetching calendar events for debug:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar events" },
      { status: 500 }
    );
  }
}