/**
 * Google Contacts operations
 */

import { SyncClient } from '../../core/client';
import { Contact } from '../../core/types';

const PEOPLE_API_BASE = 'https://people.googleapis.com/v1';

export interface GoogleContactsListOptions {
  pageSize?: number;
  pageToken?: string;
  personFields?: string[];
  requestSyncToken?: boolean;
  syncToken?: string;
  sources?: Array<'READ_SOURCE_TYPE_CONTACT' | 'READ_SOURCE_TYPE_PROFILE'>;
}

export interface GoogleContactsListResponse {
  connections?: Contact[];
  nextPageToken?: string;
  nextSyncToken?: string;
  totalPeople?: number;
  totalItems?: number;
}

/**
 * Default person fields to fetch
 */
const DEFAULT_PERSON_FIELDS = [
  'names',
  'emailAddresses',
  'phoneNumbers',
  'addresses',
  'organizations',
  'birthdays',
  'photos',
  'metadata'
];

/**
 * List contacts
 */
export async function listContacts(
  client: SyncClient,
  accountId: string,
  externalUserId: string,
  options?: GoogleContactsListOptions
): Promise<GoogleContactsListResponse> {
  const params = new URLSearchParams();
  
  // Set person fields
  const personFields = options?.personFields || DEFAULT_PERSON_FIELDS;
  params.append('personFields', personFields.join(','));
  
  if (options?.pageSize) params.append('pageSize', options.pageSize.toString());
  if (options?.pageToken) params.append('pageToken', options.pageToken);
  if (options?.requestSyncToken) params.append('requestSyncToken', 'true');
  if (options?.syncToken) params.append('syncToken', options.syncToken);
  if (options?.sources) {
    options.sources.forEach(source => params.append('sources', source));
  }

  const url = `${PEOPLE_API_BASE}/people/me/connections?${params.toString()}`;

  return await client.makeProxyRequest({
    accountId,
    externalUserId,
    targetUrl: url,
    options: {
      method: 'GET'
    }
  });
}

/**
 * Get a single contact
 */
export async function getContact(
  client: SyncClient,
  accountId: string,
  externalUserId: string,
  resourceName: string,
  personFields?: string[]
): Promise<Contact> {
  const params = new URLSearchParams();
  
  const fields = personFields || DEFAULT_PERSON_FIELDS;
  params.append('personFields', fields.join(','));

  const url = `${PEOPLE_API_BASE}/${resourceName}?${params.toString()}`;

  return await client.makeProxyRequest({
    accountId,
    externalUserId,
    targetUrl: url,
    options: {
      method: 'GET'
    }
  });
}

/**
 * Create a contact
 */
export async function createContact(
  client: SyncClient,
  accountId: string,
  externalUserId: string,
  contact: Partial<Contact>
): Promise<Contact> {
  const params = new URLSearchParams();
  params.append('personFields', DEFAULT_PERSON_FIELDS.join(','));

  const url = `${PEOPLE_API_BASE}/people:createContact?${params.toString()}`;

  return await client.makeProxyRequest({
    accountId,
    externalUserId,
    targetUrl: url,
    options: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: contact
    }
  });
}

/**
 * Update a contact
 */
export async function updateContact(
  client: SyncClient,
  accountId: string,
  externalUserId: string,
  resourceName: string,
  contact: Partial<Contact>,
  updatePersonFields: string[]
): Promise<Contact> {
  const params = new URLSearchParams();
  params.append('updatePersonFields', updatePersonFields.join(','));
  params.append('personFields', DEFAULT_PERSON_FIELDS.join(','));

  const url = `${PEOPLE_API_BASE}/${resourceName}:updateContact?${params.toString()}`;

  return await client.makeProxyRequest({
    accountId,
    externalUserId,
    targetUrl: url,
    options: {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        ...contact,
        etag: contact.etag // Required for updates
      }
    }
  });
}

/**
 * Delete a contact
 */
export async function deleteContact(
  client: SyncClient,
  accountId: string,
  externalUserId: string,
  resourceName: string
): Promise<void> {
  const url = `${PEOPLE_API_BASE}/${resourceName}:deleteContact`;

  await client.makeProxyRequest({
    accountId,
    externalUserId,
    targetUrl: url,
    options: {
      method: 'DELETE'
    }
  });
}

/**
 * Batch get contacts
 */
export async function batchGetContacts(
  client: SyncClient,
  accountId: string,
  externalUserId: string,
  resourceNames: string[],
  personFields?: string[]
): Promise<Contact[]> {
  if (resourceNames.length === 0) {
    return [];
  }

  const params = new URLSearchParams();
  const fields = personFields || DEFAULT_PERSON_FIELDS;
  params.append('personFields', fields.join(','));
  
  // Add resource names
  resourceNames.forEach(name => params.append('resourceNames', name));

  const url = `${PEOPLE_API_BASE}/people:batchGet?${params.toString()}`;

  const response = await client.makeProxyRequest<{
    responses: Array<{
      httpStatusCode: number;
      person?: Contact;
      error?: any;
    }>;
  }>({
    accountId,
    externalUserId,
    targetUrl: url,
    options: {
      method: 'GET'
    }
  });

  // Extract successful contacts
  return response.responses
    .filter(r => r.httpStatusCode === 200 && r.person)
    .map(r => r.person!);
}

/**
 * Fetch all contacts with pagination (returns an async generator)
 */
export async function* fetchAllContacts(
  client: SyncClient,
  accountId: string,
  externalUserId: string,
  options?: Omit<GoogleContactsListOptions, 'pageToken'>
): AsyncGenerator<Contact, void, unknown> {
  let pageToken: string | undefined;

  do {
    const response = await listContacts(client, accountId, externalUserId, {
      ...options,
      pageToken,
      pageSize: options?.pageSize || 100
    });

    if (!response.connections || response.connections.length === 0) {
      break;
    }

    for (const contact of response.connections) {
      yield contact;
    }

    pageToken = response.nextPageToken;

    // Small delay to avoid rate limits
    await sleep(50);
  } while (pageToken);
}

/**
 * Get contact groups
 */
export async function listContactGroups(
  client: SyncClient,
  accountId: string,
  externalUserId: string,
  options?: {
    pageSize?: number;
    pageToken?: string;
  }
): Promise<{
  contactGroups?: Array<{
    resourceName: string;
    etag?: string;
    name?: string;
    formattedName?: string;
    groupType?: 'GROUP_TYPE_UNSPECIFIED' | 'USER_CONTACT_GROUP' | 'SYSTEM_CONTACT_GROUP';
    memberCount?: number;
  }>;
  nextPageToken?: string;
  totalItems?: number;
}> {
  const params = new URLSearchParams();
  
  if (options?.pageSize) params.append('pageSize', options.pageSize.toString());
  if (options?.pageToken) params.append('pageToken', options.pageToken);

  const url = `${PEOPLE_API_BASE}/contactGroups?${params.toString()}`;

  return await client.makeProxyRequest({
    accountId,
    externalUserId,
    targetUrl: url,
    options: {
      method: 'GET'
    }
  });
}

// Utility function
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}