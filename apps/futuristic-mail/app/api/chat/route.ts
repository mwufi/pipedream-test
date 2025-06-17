import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  const user = await currentUser();
  const { messages } = await req.json();

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: `You are a helpful email assistant for a futuristic email application called Neo Mail. 
    ${user ? `The user's name is ${user.firstName || "User"}.` : ""}
    You help users manage their emails, compose messages, organize their inbox, and provide email-related tips.
    Keep responses concise and friendly. Use email-related metaphors when appropriate.
    If asked about features, mention: Smart Inbox (AI-powered organization), AI-assisted composition, and email analytics.`,
    messages,
  });

  return result.toDataStreamResponse();
}