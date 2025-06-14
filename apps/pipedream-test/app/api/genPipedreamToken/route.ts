import { NextResponse } from "next/server";
import pd from "@/lib/server/pipedream_client";

/**
 * Example curl request:
 * curl "http://localhost:3000/api/genPipedreamToken?userId=123"
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }

        // Create a token for a specific user
        const { token, expires_at, connect_link_url } = await pd.createConnectToken({
            external_user_id: userId,
        });

        return NextResponse.json({ token, expires_at, connect_link_url });
    } catch (error) {
        return NextResponse.json({ error: "Failed to generate token" }, { status: 500 });
    }
}
