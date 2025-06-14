import { NextRequest, NextResponse } from "next/server";
import { pipedream } from "@/lib/pipedream";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ componentType: string; componentKey: string }> }
) {
  try {
    const { componentType, componentKey } = await params;
    const component = await pipedream.getComponent(componentType, componentKey);
    return NextResponse.json(component);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get component" },
      { status: 500 }
    );
  }
}