import { NextRequest, NextResponse } from "next/server";
import pd from "@/lib/server/pipedream_client";

interface ProxyRequestBody {
  account_id: string;
  external_user_id: string;
  target_url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

/**
 * Proxy API route to make authenticated requests to third-party APIs
 * through Pipedream Connect.
 * 
 * Example curl request:
 * curl -X POST http://localhost:3000/api/pipedream/proxy \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "account_id": "account123",
 *     "external_user_id": "user123",
 *     "target_url": "https://api.example.com/endpoint",
 *     "method": "GET",
 *     "headers": {"Accept": "application/json"},
 *     "body": {}
 *   }'
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: ProxyRequestBody = await request.json();

    // Validate required fields
    if (!body.account_id) {
      return NextResponse.json(
        { error: "account_id is required" },
        { status: 400 }
      );
    }

    if (!body.external_user_id) {
      return NextResponse.json(
        { error: "external_user_id is required" },
        { status: 400 }
      );
    }

    if (!body.target_url) {
      return NextResponse.json(
        { error: "target_url is required" },
        { status: 400 }
      );
    }

    // Validate target_url is a valid URL
    try {
      new URL(body.target_url);
    } catch (e) {
      return NextResponse.json(
        { error: "target_url must be a valid URL" },
        { status: 400 }
      );
    }

    // Make the proxy request using Pipedream SDK with correct signature
    const response = await pd.makeProxyRequest(
      {
        searchParams: {
          account_id: body.account_id,
          external_user_id: body.external_user_id,
        }
      },
      {
        url: body.target_url,
        options: {
          method: (body.method || "GET") as "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
          headers: body.headers || {},
          body: body.body ? JSON.stringify(body.body) : undefined,
        }
      }
    );

    // The response from makeProxyRequest is just the body data
    return NextResponse.json({
      status: 200,
      statusText: "OK",
      headers: {},
      data: response,
    });

  } catch (error) {
    console.error("Proxy request error:", error);

    // Handle specific error types
    if (error instanceof Error) {
      // Check for authentication errors
      if (error.message.includes("authentication") || error.message.includes("unauthorized")) {
        return NextResponse.json(
          { error: "Authentication failed. Please check your credentials." },
          { status: 401 }
        );
      }

      // Check for account not found errors
      if (error.message.includes("account") && error.message.includes("not found")) {
        return NextResponse.json(
          { error: "Account not found. Please ensure the account exists." },
          { status: 404 }
        );
      }

      // Check for rate limiting
      if (error.message.includes("rate limit")) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      }

      // Generic error with message
      return NextResponse.json(
        { error: error.message || "Failed to make proxy request" },
        { status: 500 }
      );
    }

    // Fallback for unknown error types
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}