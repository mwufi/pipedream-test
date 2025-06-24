import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { emails } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;

        if (!id) {
            return NextResponse.json({ error: "Email ID is required" }, { status: 400 });
        }

        // Get the email by ID and ensure it belongs to the current user
        const email = await db
            .select()
            .from(emails)
            .where(and(eq(emails.id, id), eq(emails.userId, userId)))
            .limit(1);

        if (!email || email.length === 0) {
            return NextResponse.json({ error: "Email not found" }, { status: 404 });
        }

        return NextResponse.json(email[0]);
    } catch (error) {
        console.error("Error fetching email:", error);
        return NextResponse.json(
            { error: "Failed to fetch email" },
            { status: 500 }
        );
    }
} 