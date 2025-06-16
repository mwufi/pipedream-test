#!/usr/bin/env bun

import { parseArgs } from "util";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

const PIPEDREAM_API_KEY = process.env.PIPEDREAM_API_KEY;
const PIPEDREAM_PROJECT_ID = process.env.PIPEDREAM_PROJECT_ID;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface Account {
  id: string;
  name: string;
  external_id: string;
  healthy: boolean;
  dead: boolean | null;
  app: {
    id: string;
    name_slug: string;
    name: string;
    auth_type: string;
    description: string;
    img_src: string;
    categories: string[];
  };
  created_at: string;
  updated_at: string;
}

interface GoogleContact {
  resourceName: string;
  etag: string;
  metadata?: {
    sources?: Array<{
      type: string;
      id: string;
      etag?: string;
      updateTime?: string;
    }>;
    objectType?: string;
    deleted?: boolean;
  };
  names?: Array<{
    metadata?: {
      primary?: boolean;
      source?: {
        type: string;
        id: string;
      };
    };
    displayName?: string;
    familyName?: string;
    givenName?: string;
    displayNameLastFirst?: string;
    unstructuredName?: string;
    honorificPrefix?: string;
    middleName?: string;
    honorificSuffix?: string;
    phoneticFullName?: string;
    phoneticFamilyName?: string;
    phoneticGivenName?: string;
    phoneticMiddleName?: string;
    phoneticHonorificPrefix?: string;
    phoneticHonorificSuffix?: string;
  }>;
  nicknames?: Array<{
    metadata?: {
      primary?: boolean;
      source?: {
        type: string;
        id: string;
      };
    };
    value: string;
  }>;
  coverPhotos?: Array<{
    metadata?: {
      primary?: boolean;
      source?: {
        type: string;
        id: string;
      };
    };
    url: string;
    default?: boolean;
  }>;
  photos?: Array<{
    metadata?: {
      primary?: boolean;
      source?: {
        type: string;
        id: string;
      };
    };
    url: string;
    default?: boolean;
  }>;
  birthdays?: Array<{
    metadata?: {
      primary?: boolean;
      source?: {
        type: string;
        id: string;
      };
    };
    date?: {
      year?: number;
      month?: number;
      day?: number;
    };
    text?: string;
  }>;
  addresses?: Array<{
    metadata?: {
      primary?: boolean;
      source?: {
        type: string;
        id: string;
      };
    };
    formattedValue?: string;
    type?: string;
    formattedType?: string;
    poBox?: string;
    streetAddress?: string;
    extendedAddress?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country?: string;
    countryCode?: string;
  }>;
  emailAddresses?: Array<{
    metadata?: {
      primary?: boolean;
      source?: {
        type: string;
        id: string;
      };
      verified?: boolean;
    };
    value: string;
    type?: string;
    formattedType?: string;
    displayName?: string;
  }>;
  phoneNumbers?: Array<{
    metadata?: {
      primary?: boolean;
      source?: {
        type: string;
        id: string;
      };
      verified?: boolean;
    };
    value: string;
    canonicalForm?: string;
    type?: string;
    formattedType?: string;
  }>;
  biographies?: Array<{
    metadata?: {
      primary?: boolean;
      source?: {
        type: string;
        id: string;
      };
    };
    value: string;
    contentType?: string;
  }>;
  urls?: Array<{
    metadata?: {
      primary?: boolean;
      source?: {
        type: string;
        id: string;
      };
    };
    value: string;
    type?: string;
    formattedType?: string;
  }>;
  organizations?: Array<{
    metadata?: {
      primary?: boolean;
      source?: {
        type: string;
        id: string;
      };
    };
    type?: string;
    formattedType?: string;
    startDate?: {
      year?: number;
      month?: number;
      day?: number;
    };
    endDate?: {
      year?: number;
      month?: number;
      day?: number;
    };
    current?: boolean;
    name?: string;
    phoneticName?: string;
    department?: string;
    title?: string;
    jobDescription?: string;
    symbol?: string;
    domain?: string;
    location?: string;
  }>;
  memberships?: Array<{
    metadata?: {
      source?: {
        type: string;
        id: string;
      };
    };
    contactGroupMembership?: {
      contactGroupId: string;
      contactGroupResourceName: string;
    };
    domainMembership?: {
      inViewerDomain: boolean;
    };
  }>;
  events?: Array<{
    metadata?: {
      primary?: boolean;
      source?: {
        type: string;
        id: string;
      };
    };
    date?: {
      year?: number;
      month?: number;
      day?: number;
    };
    type?: string;
    formattedType?: string;
  }>;
  relations?: Array<{
    metadata?: {
      primary?: boolean;
      source?: {
        type: string;
        id: string;
      };
    };
    person?: string;
    type?: string;
    formattedType?: string;
  }>;
  userDefined?: Array<{
    metadata?: {
      primary?: boolean;
      source?: {
        type: string;
        id: string;
      };
    };
    key: string;
    value: string;
  }>;
  imClients?: Array<{
    metadata?: {
      primary?: boolean;
      source?: {
        type: string;
        id: string;
      };
    };
    username?: string;
    type?: string;
    formattedType?: string;
    protocol?: string;
    formattedProtocol?: string;
  }>;
}

interface ProcessedContact {
  id: string;
  displayName?: string;
  givenName?: string;
  familyName?: string;
  middleName?: string;
  nicknames?: string[];
  emailAddresses?: Array<{
    value: string;
    type?: string;
    primary?: boolean;
  }>;
  phoneNumbers?: Array<{
    value: string;
    type?: string;
    primary?: boolean;
  }>;
  addresses?: Array<{
    formattedValue?: string;
    type?: string;
    streetAddress?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country?: string;
  }>;
  birthdays?: Array<{
    date?: {
      year?: number;
      month?: number;
      day?: number;
    };
    text?: string;
  }>;
  organizations?: Array<{
    name?: string;
    title?: string;
    department?: string;
    type?: string;
  }>;
  urls?: Array<{
    value: string;
    type?: string;
  }>;
  notes?: string[];
  photoUrl?: string;
  groups?: string[];
  metadata?: {
    deleted?: boolean;
    sources?: Array<{
      type: string;
      id: string;
      updateTime?: string;
    }>;
  };
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper to unwrap proxy API responses
function unwrapProxyResponse(response: any): any {
  // If response has a data property with status/statusText, it's wrapped
  if (response && response.data && response.status && response.statusText) {
    return response.data;
  }
  return response;
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
  initialDelay = 1000
): Promise<Response> {
  let lastError: Error | null = null;
  let delay = initialDelay;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      const response = await fetch(url, options);

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : delay;
        console.log(`Rate limit hit. Waiting ${waitTime / 1000} seconds...`);
        await sleep(waitTime);
        delay *= 2;
        continue;
      }

      if (!response.ok && response.status >= 500) {
        throw new Error(`Server error: ${response.status}`);
      }

      return response;
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries) {
        console.log(`Request failed, retrying in ${delay / 1000} seconds...`);
        await sleep(delay);
        delay *= 2;
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

async function getUserAccounts(userId: string): Promise<Account[]> {
  const response = await fetchWithRetry(
    `${BASE_URL}/api/pipedream/accounts`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-external-user-id': userId,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API Error Response: ${errorText}`);
    throw new Error(`Failed to fetch accounts: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  // Handle paginated response structure
  if (data && data.data) {
    return data.data;
  }
  
  // Handle direct accounts array
  if (data && data.accounts) {
    return data.accounts;
  }
  
  console.error('Unexpected API response structure:', data);
  return [];
}

async function getContacts(
  userId: string,
  accountId: string,
  pageToken?: string,
  pageSize = 1000
): Promise<{ contacts: GoogleContact[]; nextPageToken?: string }> {
  const params = new URLSearchParams({
    pageSize: pageSize.toString(),
    personFields: 'names,nicknames,emailAddresses,phoneNumbers,addresses,birthdays,biographies,organizations,urls,photos,memberships,events,relations,userDefined,imClients,metadata',
    ...(pageToken && { pageToken }),
  });

  const response = await fetchWithRetry(
    `${BASE_URL}/api/pipedream/proxy`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account_id: accountId,
        external_user_id: userId,
        target_url: `https://people.googleapis.com/v1/people/me/connections?${params}`,
        options: {
          method: 'GET',
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get contacts: ${response.statusText}`);
  }

  const responseData = await response.json();
  const data = unwrapProxyResponse(responseData);
  return {
    contacts: data.connections || [],
    nextPageToken: data.nextPageToken,
  };
}

function processContact(contact: GoogleContact): ProcessedContact {
  const primaryName = contact.names?.find(n => n.metadata?.primary) || contact.names?.[0];
  const primaryPhoto = contact.photos?.find(p => p.metadata?.primary) || contact.photos?.[0];

  const processed: ProcessedContact = {
    id: contact.resourceName,
    displayName: primaryName?.displayName,
    givenName: primaryName?.givenName,
    familyName: primaryName?.familyName,
    middleName: primaryName?.middleName,
    metadata: {
      deleted: contact.metadata?.deleted,
      sources: contact.metadata?.sources,
    },
  };

  if (contact.nicknames?.length) {
    processed.nicknames = contact.nicknames.map(n => n.value);
  }

  if (contact.emailAddresses?.length) {
    processed.emailAddresses = contact.emailAddresses.map(e => ({
      value: e.value,
      type: e.type,
      primary: e.metadata?.primary,
    }));
  }

  if (contact.phoneNumbers?.length) {
    processed.phoneNumbers = contact.phoneNumbers.map(p => ({
      value: p.value,
      type: p.type,
      primary: p.metadata?.primary,
    }));
  }

  if (contact.addresses?.length) {
    processed.addresses = contact.addresses.map(a => ({
      formattedValue: a.formattedValue,
      type: a.type,
      streetAddress: a.streetAddress,
      city: a.city,
      region: a.region,
      postalCode: a.postalCode,
      country: a.country,
    }));
  }

  if (contact.birthdays?.length) {
    processed.birthdays = contact.birthdays.map(b => ({
      date: b.date,
      text: b.text,
    }));
  }

  if (contact.organizations?.length) {
    processed.organizations = contact.organizations.map(o => ({
      name: o.name,
      title: o.title,
      department: o.department,
      type: o.type,
    }));
  }

  if (contact.urls?.length) {
    processed.urls = contact.urls.map(u => ({
      value: u.value,
      type: u.type,
    }));
  }

  if (contact.biographies?.length) {
    processed.notes = contact.biographies.map(b => b.value);
  }

  if (primaryPhoto?.url) {
    processed.photoUrl = primaryPhoto.url;
  }

  if (contact.memberships?.length) {
    const groups = contact.memberships
      .filter(m => m.contactGroupMembership)
      .map(m => m.contactGroupMembership!.contactGroupResourceName);
    if (groups.length > 0) {
      processed.groups = groups;
    }
  }

  return processed;
}

async function* downloadContacts(
  userId: string,
  accountId: string
): AsyncGenerator<ProcessedContact> {
  let pageToken: string | undefined;
  let totalProcessed = 0;
  let consecutiveErrors = 0;
  const maxConsecutiveErrors = 5;

  console.log('Starting contacts download...');

  do {
    try {
      const { contacts, nextPageToken } = await getContacts(userId, accountId, pageToken);
      pageToken = nextPageToken;

      if (!contacts || contacts.length === 0) {
        console.log('No more contacts to process');
        break;
      }

      console.log(`Processing batch of ${contacts.length} contacts...`);

      for (const contact of contacts) {
        try {
          const processedContact = processContact(contact);
          yield processedContact;
          
          totalProcessed++;
          consecutiveErrors = 0;
          
          if (totalProcessed % 100 === 0) {
            console.log(`Processed ${totalProcessed} contacts...`);
          }

          // Small delay to avoid rate limits
          await sleep(50);
        } catch (error) {
          console.error(`Error processing contact ${contact.resourceName}:`, error);
          consecutiveErrors++;
          
          if (consecutiveErrors >= maxConsecutiveErrors) {
            throw new Error(`Too many consecutive errors (${maxConsecutiveErrors})`);
          }
          
          continue;
        }
      }
    } catch (error) {
      console.error('Error fetching contact batch:', error);
      throw error;
    }
  } while (pageToken);

  console.log(`Download complete. Total contacts processed: ${totalProcessed}`);
}

async function main() {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      email: {
        type: 'string',
        short: 'e',
      },
      output: {
        type: 'string',
        short: 'o',
        default: 'contacts.jsonl',
      },
    },
    allowPositionals: true,
  });

  if (positionals.length === 0) {
    console.error('Usage: bun run sync-service/contacts.ts <user-id> --email <email> --output <output-file>');
    process.exit(1);
  }

  const userId = positionals[0] as string;
  const targetEmail = values.email;
  const outputFile = values.output as string;

  try {
    // Get user accounts
    console.log(`Fetching accounts for user: ${userId}`);
    const accounts = await getUserAccounts(userId);
    
    // Filter Google Contacts accounts
    const contactsAccounts = accounts.filter(acc => acc.app.name_slug === 'google_contacts');
    
    if (contactsAccounts.length === 0) {
      console.error('No Google Contacts accounts found for this user');
      process.exit(1);
    }

    console.log('\nAvailable Google Contacts accounts:');
    contactsAccounts.forEach((acc, index) => {
      console.log(`${index + 1}. ${acc.name} (ID: ${acc.id})`);
    });

    // Find the requested account
    let selectedAccount: Account | undefined;
    
    // If only one account, use it regardless of email match
    if (contactsAccounts.length === 1) {
      selectedAccount = contactsAccounts[0];
      if (targetEmail) {
        console.log(`\nNote: Using the only available account: ${selectedAccount.name}`);
      }
    } else if (targetEmail) {
      // Try to match by name or external_id
      selectedAccount = contactsAccounts.find(acc => 
        acc.name.toLowerCase().includes(targetEmail.toLowerCase()) ||
        acc.external_id?.toLowerCase().includes(targetEmail.toLowerCase())
      );
      
      if (!selectedAccount) {
        console.error(`\nGoogle Contacts account matching "${targetEmail}" not found`);
        console.error('Please use one of the account names listed above');
        process.exit(1);
      }
    } else {
      selectedAccount = contactsAccounts[0];
    }

    console.log(`\nUsing account: ${selectedAccount.name}`);
    console.log(`Output file: ${outputFile}`);
    console.log('Starting download...\n');

    // Create write stream
    const writeStream = createWriteStream(outputFile);
    
    // Download and write contacts
    const contactGenerator = downloadContacts(userId, selectedAccount.id);
    
    const readableStream = Readable.from(
      (async function* () {
        for await (const contact of contactGenerator) {
          yield JSON.stringify(contact) + '\n';
        }
      })()
    );

    await pipeline(readableStream, writeStream);
    
    console.log(`\nDownload complete! Contacts saved to ${outputFile}`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}