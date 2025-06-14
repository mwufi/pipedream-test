import { NextRequest, NextResponse } from "next/server";
import { pipedream } from "@/lib/pipedream";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    await pipedream.deleteExternalUser(userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete external user" },
      { status: 500 }
    );
  }
}