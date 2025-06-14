import { NextRequest, NextResponse } from "next/server";
import { pipedream } from "@/lib/pipedream";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ componentType: string }> }
) {
  try {
    const { componentType } = await params;
    const body = await request.json();
    
    const { configured_props, external_user_id, id, prop_name } = body;

    if (!configured_props || !external_user_id || !id || !prop_name) {
      return NextResponse.json(
        { error: "configured_props, external_user_id, id, and prop_name are required" },
        { status: 400 }
      );
    }

    const result = await pipedream.configureComponent(componentType, {
      configured_props,
      external_user_id,
      id,
      prop_name,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to configure component" },
      { status: 500 }
    );
  }
}