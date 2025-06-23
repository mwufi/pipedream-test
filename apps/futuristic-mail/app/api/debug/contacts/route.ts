import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { contacts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allContacts = await db
      .select()
      .from(contacts)
      .where(eq(contacts.userId, userId))
      .orderBy(contacts.name);

    return NextResponse.json(allContacts);
  } catch (error) {
    console.error("Error fetching contacts for debug:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}