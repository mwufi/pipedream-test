import { NextRequest, NextResponse } from "next/server";
import { createGoogleIndexer, GoogleIndexerAccounts } from "@/lib/google-indexer";

interface IndexRequest {
  accounts: {
    gmail?: string;
    calendar?: string;
    contacts?: string;
  };
  external_user_id: string;
  type: "messages" | "events" | "contacts" | "all";
  options?: {
    maxResults?: number;
    query?: string;
    timeMin?: string;
    timeMax?: string;
  };
}

/**
 * API route to index Google data (Gmail messages, calendar events, contacts)
 * 
 * Example request:
 * POST /api/google-index
 * {
 *   "accounts": {
 *     "gmail": "account123",
 *     "calendar": "account456",
 *     "contacts": "account789"
 *   },
 *   "external_user_id": "user123",
 *   "type": "all",
 *   "options": {
 *     "maxResults": 20
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body: IndexRequest = await request.json();

    // Validate required fields
    if (!body.accounts) {
      return NextResponse.json(
        { error: "accounts object is required" },
        { status: 400 }
      );
    }

    if (!body.external_user_id) {
      return NextResponse.json(
        { error: "external_user_id is required" },
        { status: 400 }
      );
    }

    if (!body.type) {
      return NextResponse.json(
        { error: "type is required (messages, events, contacts, or all)" },
        { status: 400 }
      );
    }

    const indexer = createGoogleIndexer(body.accounts, body.external_user_id);
    const options = body.options || {};

    let result;
    
    switch (body.type) {
      case "messages":
        result = await indexer.indexGmailMessages(options);
        break;
      case "events":
        result = await indexer.indexCalendarEvents(options);
        break;
      case "contacts":
        result = await indexer.indexContacts(options);
        break;
      case "all":
        result = await indexer.indexAll(options);
        break;
      default:
        return NextResponse.json(
          { error: "Invalid type. Must be one of: messages, events, contacts, all" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      type: body.type,
      data: result,
      count: Array.isArray(result) ? result.length : {
        messages: result.messages?.length || 0,
        events: result.events?.length || 0,
        contacts: result.contacts?.length || 0
      }
    });

  } catch (error) {
    console.error("Google indexing error:", error);

    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes("authentication") || error.message.includes("unauthorized")) {
        return NextResponse.json(
          { error: "Authentication failed. Please check your Google account connection." },
          { status: 401 }
        );
      }

      if (error.message.includes("rate limit")) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      }

      if (error.message.includes("quota")) {
        return NextResponse.json(
          { error: "API quota exceeded. Please try again later." },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: error.message || "Failed to index Google data" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}