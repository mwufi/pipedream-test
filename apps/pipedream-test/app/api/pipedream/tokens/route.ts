import { NextRequest, NextResponse } from "next/server";
import { pipedream } from "@/lib/pipedream";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { external_user_id, ...options } = body;

    if (!external_user_id) {
      return NextResponse.json(
        { error: "external_user_id is required" },
        { status: 400 }
      );
    }

    const token = await pipedream.createConnectToken({
      external_user_id,
      ...options,
    });

    return NextResponse.json(token);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create token" },
      { status: 500 }
    );
  }
}