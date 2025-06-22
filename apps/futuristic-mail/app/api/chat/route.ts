import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { currentUser, auth } from "@clerk/nextjs/server";
import { experimental_createMCPClient as createMCPClient } from 'ai';
import { createReadEmailsTool } from '@/tools/read-emails';
import { createReadContactsTool } from '@/tools/read-contacts';
import { createReadCalendarEventsTool } from '@/tools/read-calendar';

const mcpClient = await createMCPClient({
  transport: {
    type: 'sse',
    url: 'https://my-mcp-server.partyparrotz.workers.dev/sse',

    // optional: configure HTTP headers, e.g. for authentication
    headers: {
      Authorization: 'Bearer my-api-key',
    },
  },
});

export async function POST(req: Request) {
  const user = await currentUser();
  const { userId } = await auth();
  const { messages } = await req.json();
  
  console.log('[chat/route] User:', user?.firstName, 'userId:', userId);
  
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const mcpTools = await mcpClient.tools();

  // Create tools with the userId context
  const allTools = {
    ...mcpTools,
    readEmails: createReadEmailsTool(userId),
    readContacts: createReadContactsTool(userId),
    readCalendarEvents: createReadCalendarEventsTool(userId),
  };

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: `You are a helpful email assistant for a futuristic email application called Neo Mail. 
    ${user ? `The user's name is ${user.firstName || "User"}.` : ""}
    
    Today's date is ${new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}, ${new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZoneName: 'short' 
    })}.
    
    You help users manage their emails, compose messages, organize their inbox, and provide email-related tips.
    You have access to tools that let you read the user's emails, contacts, and calendar events.
    
    When users mention relative dates like "yesterday", "last week", "next month", etc., calculate the appropriate dates based on today's date.
    
    Keep responses concise and friendly. Use email-related metaphors when appropriate.
    If asked about features, mention: Smart Inbox (AI-powered organization), AI-assisted composition, and email analytics.`,
    messages,
    tools: allTools,
    maxSteps: 4,
  });

  return result.toDataStreamResponse();
}