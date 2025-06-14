import { pipedream, ProxyRequestOptions } from "./pipedream";

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: {
    partId: string;
    mimeType: string;
    filename: string;
    headers: Array<{
      name: string;
      value: string;
    }>;
    body: {
      size: number;
      data?: string;
    };
    parts?: Array<{
      partId: string;
      mimeType: string;
      filename: string;
      body: {
        size: number;
        data?: string;
      };
    }>;
  };
  sizeEstimate: number;
  historyId: string;
  internalDate: string;
}

export interface ProcessedGmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string[];
  cc: string[];
  bcc: string[];
  date: Date;
  snippet: string;
  body: string;
  labels: string[];
  attachments: Array<{
    filename: string;
    mimeType: string;
    size: number;
  }>;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus: string;
  }>;
  location?: string;
  creator?: {
    email: string;
    displayName?: string;
  };
  organizer?: {
    email: string;
    displayName?: string;
  };
  status: string;
  created: string;
  updated: string;
}

export interface Contact {
  resourceName: string;
  etag: string;
  names?: Array<{
    displayName: string;
    givenName?: string;
    familyName?: string;
  }>;
  emailAddresses?: Array<{
    value: string;
    type?: string;
    displayName?: string;
  }>;
  phoneNumbers?: Array<{
    value: string;
    type?: string;
  }>;
  organizations?: Array<{
    name: string;
    title?: string;
  }>;
  addresses?: Array<{
    formattedValue: string;
    type?: string;
  }>;
}

export interface IndexingOptions {
  maxResults?: number;
  query?: string;
  timeMin?: string;
  timeMax?: string;
}

export interface GoogleIndexerAccounts {
  gmail?: string;
  calendar?: string;
  contacts?: string;
}

export class GoogleIndexer {
  constructor(
    private accounts: GoogleIndexerAccounts,
    private externalUserId: string
  ) {}

  /**
   * Make a proxy request with proper error handling
   */
  private async makeProxyRequest(accountId: string, url: string, options?: ProxyRequestOptions) {
    try {
      return await pipedream.makeProxyRequest({
        account_id: accountId,
        external_user_id: this.externalUserId,
        target_url: url,
        options: options || { method: "GET" }
      });
    } catch (error: any) {
      // Check for specific error types
      if (error.message?.includes("403") || error.message?.includes("insufficientPermissions")) {
        throw new Error(`Insufficient permissions for ${url}. Please reconnect your account with the required scopes.`);
      }
      if (error.message?.includes("401") || error.message?.includes("unauthorized")) {
        throw new Error(`Authentication failed for ${url}. Please check your account connection.`);
      }
      if (error.message?.includes("domain not allowed")) {
        throw new Error(`Domain not allowed for ${url}. Please check your app's allowed domains.`);
      }
      throw error;
    }
  }

  /**
   * Fetch and index Gmail messages with full details
   */
  async indexGmailMessages(options: IndexingOptions = {}): Promise<ProcessedGmailMessage[]> {
    if (!this.accounts.gmail) {
      throw new Error("No Gmail account connected. Please connect a Gmail account first.");
    }

    const { maxResults = 10, query = "" } = options;
    
    // First, get the list of message IDs
    const listParams = new URLSearchParams({
      maxResults: maxResults.toString(),
      ...(query && { q: query })
    });

    const messagesListResponse = await this.makeProxyRequest(
      this.accounts.gmail,
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?${listParams}`
    );

    if (!messagesListResponse.body?.messages) {
      return [];
    }

    const messageIds = messagesListResponse.body.messages.map((msg: any) => msg.id);
    const processedMessages: ProcessedGmailMessage[] = [];

    // Fetch full details for each message (limit to first 5 for demo)
    const messagesToFetch = messageIds.slice(0, 5);
    
    for (const messageId of messagesToFetch) {
      try {
        const messageResponse = await this.makeProxyRequest(
          this.accounts.gmail,
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`
        );

        const message: GmailMessage = messageResponse.body;
        const processed = this.processGmailMessage(message);
        processedMessages.push(processed);
      } catch (error) {
        console.error(`Failed to fetch message ${messageId}:`, error);
      }
    }

    return processedMessages;
  }

  /**
   * Fetch and index calendar events
   */
  async indexCalendarEvents(options: IndexingOptions = {}): Promise<CalendarEvent[]> {
    if (!this.accounts.calendar) {
      throw new Error("No Calendar account connected. Please connect a Google Calendar account first.");
    }

    const { maxResults = 10, timeMin, timeMax } = options;
    
    const params = new URLSearchParams({
      maxResults: maxResults.toString(),
      singleEvents: "true",
      orderBy: "startTime",
      ...(timeMin && { timeMin: timeMin || new Date().toISOString() }),
      ...(timeMax && { timeMax })
    });

    const response = await this.makeProxyRequest(
      this.accounts.calendar,
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`
    );

    return response.body?.items || [];
  }

  /**
   * Fetch and index contacts
   */
  async indexContacts(options: IndexingOptions = {}): Promise<Contact[]> {
    if (!this.accounts.contacts) {
      throw new Error("No Contacts account connected. Please connect a Google Contacts account first.");
    }

    const { maxResults = 10 } = options;
    
    const params = new URLSearchParams({
      pageSize: maxResults.toString(),
      personFields: "names,emailAddresses,phoneNumbers,organizations,addresses"
    });

    const response = await this.makeProxyRequest(
      this.accounts.contacts,
      `https://people.googleapis.com/v1/people/me/connections?${params}`
    );

    return response.body?.connections || [];
  }

  /**
   * Index all Google data (messages, events, contacts)
   */
  async indexAll(options: IndexingOptions = {}): Promise<{
    messages: ProcessedGmailMessage[] | null;
    events: CalendarEvent[] | null;
    contacts: Contact[] | null;
    errors: { [key: string]: string };
  }> {
    const results: {
      messages: ProcessedGmailMessage[] | null;
      events: CalendarEvent[] | null;
      contacts: Contact[] | null;
      errors: { [key: string]: string };
    } = {
      messages: null,
      events: null,
      contacts: null,
      errors: {}
    };

    // Try each service independently
    try {
      results.messages = await this.indexGmailMessages(options);
    } catch (error: any) {
      results.errors.gmail = error.message;
      console.error("Gmail indexing failed:", error);
    }

    try {
      results.events = await this.indexCalendarEvents(options);
    } catch (error: any) {
      results.errors.calendar = error.message;
      console.error("Calendar indexing failed:", error);
    }

    try {
      results.contacts = await this.indexContacts(options);
    } catch (error: any) {
      results.errors.contacts = error.message;
      console.error("Contacts indexing failed:", error);
    }

    return results;
  }

  /**
   * Process raw Gmail message to extract key information
   */
  private processGmailMessage(message: GmailMessage): ProcessedGmailMessage {
    const headers = message.payload.headers;
    const getHeader = (name: string) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || "";
    
    const parseAddresses = (addressString: string): string[] => {
      if (!addressString) return [];
      return addressString.split(',').map(addr => addr.trim().replace(/.*<(.+)>.*/, '$1'));
    };

    // Extract body content
    let body = "";
    if (message.payload.body.data) {
      body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
    } else if (message.payload.parts) {
      // Look for text/plain or text/html parts
      for (const part of message.payload.parts) {
        if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
          if (part.body.data) {
            body = Buffer.from(part.body.data, 'base64').toString('utf-8');
            break;
          }
        }
      }
    }

    // Extract attachments
    const attachments: Array<{ filename: string; mimeType: string; size: number }> = [];
    if (message.payload.parts) {
      for (const part of message.payload.parts) {
        if (part.filename && part.filename.length > 0) {
          attachments.push({
            filename: part.filename,
            mimeType: part.mimeType,
            size: part.body.size
          });
        }
      }
    }

    return {
      id: message.id,
      threadId: message.threadId,
      subject: getHeader("Subject"),
      from: getHeader("From"),
      to: parseAddresses(getHeader("To")),
      cc: parseAddresses(getHeader("Cc")),
      bcc: parseAddresses(getHeader("Bcc")),
      date: new Date(parseInt(message.internalDate)),
      snippet: message.snippet,
      body: body,
      labels: message.labelIds,
      attachments: attachments
    };
  }
}

/**
 * Create a Google indexer instance with support for multiple accounts
 */
export function createGoogleIndexer(accounts: GoogleIndexerAccounts, externalUserId: string): GoogleIndexer {
  return new GoogleIndexer(accounts, externalUserId);
}