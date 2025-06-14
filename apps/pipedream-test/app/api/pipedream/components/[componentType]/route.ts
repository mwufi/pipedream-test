import { NextRequest, NextResponse } from "next/server";
import { pipedream } from "@/lib/pipedream";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ componentType: string }> }
) {
  try {
    const { componentType } = await params;
    const searchParams = request.nextUrl.searchParams;
    const options = {
      app: searchParams.get("app") || undefined,
      q: searchParams.get("q") || undefined,
    };

    const components = await pipedream.listComponents(componentType, options);
    return NextResponse.json(components);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list components" },
      { status: 500 }
    );
  }
}