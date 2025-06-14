import { NextRequest, NextResponse } from "next/server";
import { pipedream } from "@/lib/pipedream";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const includeCredentials = searchParams.get("include_credentials") === "true";

    const account = await pipedream.getAccount(accountId, includeCredentials);
    return NextResponse.json(account);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get account" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params;
    await pipedream.deleteAccount(accountId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete account" },
      { status: 500 }
    );
  }
}