import adminDb from "@/lib/instant_serverside_db";

const MEILISEARCH_URL = 'http://localhost:7700';
const MEILISEARCH_API_KEY = 'your-master-key'; // Replace with your actual key if you have one

interface EmailDocument {
    id: string;
    messageId: string;
    threadId: string;
    accountId: string;
    userId: string;
    subject: string;
    from: string;
    date: string;
    snippet?: string;
    labelIds?: string[];
    historyId?: string;
    internalDate?: string;
    syncedAt: number;
    // Additional fields for better search
    fromDomain?: string;
    dayOfWeek?: string;
    year?: number;
    month?: number;
    hasSnippet?: boolean;
}

function extractEmailDomain(email: string): string {
    const match = email.match(/@([^>]+)/);
    return match ? match[1] : '';
}

function parseEmailDate(dateString: string) {
    const date = new Date(dateString);
    return {
        dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }),
        year: date.getFullYear(),
        month: date.getMonth() + 1,
    };
}

async function performEmailSearch(params: any) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
            if (Array.isArray(value)) {
                queryParams.append(key, value.join(','));
            } else {
                queryParams.append(key, String(value));
            }
        }
    });

    const searchResponse = await fetch(`${MEILISEARCH_URL}/indexes/emails/search?${queryParams}`, {
        headers: {
            ...(MEILISEARCH_API_KEY && { 'Authorization': `Bearer ${MEILISEARCH_API_KEY}` })
        }
    });

    if (searchResponse.ok) {
        const results = await searchResponse.json();

        if (params.facets && results.facetDistribution) {
            console.log('Facet Distribution:');
            Object.entries(results.facetDistribution).forEach(([facet, distribution]: [string, any]) => {
                console.log(`  ${facet}:`);
                Object.entries(distribution).forEach(([value, count]) => {
                    console.log(`    ${value}: ${count} emails`);
                });
            });
        } else if (results.hits.length > 0) {
            console.log(`Found ${results.estimatedTotalHits} email results:`);
            results.hits.forEach((hit: any, index: number) => {
                if (index < 5) { // Show first 5 results
                    console.log(`  - ${hit.subject}`);
                    console.log(`    From: ${hit.from} | Date: ${hit.date}`);
                    if (hit.snippet) console.log(`    Snippet: ${hit.snippet.substring(0, 100)}...`);
                }
            });
        } else {
            console.log('No email results found');
        }
    } else {
        console.error('Email search failed:', await searchResponse.text());
    }
}

async function indexEmailsToMeilisearch(emails: EmailDocument[]) {
    try {
        // Create or update the index
        const indexResponse = await fetch(`${MEILISEARCH_URL}/indexes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(MEILISEARCH_API_KEY && { 'Authorization': `Bearer ${MEILISEARCH_API_KEY}` })
            },
            body: JSON.stringify({
                uid: 'emails',
                primaryKey: 'id'
            })
        });

        if (!indexResponse.ok && indexResponse.status !== 409) {
            console.error('Failed to create emails index:', await indexResponse.text());
            return;
        }

        console.log('Emails index created or already exists');

        // Configure filterable attributes for faceted search
        const settingsResponse = await fetch(`${MEILISEARCH_URL}/indexes/emails/settings`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(MEILISEARCH_API_KEY && { 'Authorization': `Bearer ${MEILISEARCH_API_KEY}` })
            },
            body: JSON.stringify({
                filterableAttributes: ['fromDomain', 'userId', 'accountId', 'labelIds', 'dayOfWeek', 'year', 'month', 'hasSnippet'],
                sortableAttributes: ['syncedAt', 'date', 'year', 'month'],
                displayedAttributes: ['id', 'messageId', 'subject', 'from', 'date', 'snippet', 'fromDomain', 'dayOfWeek', 'year', 'month', 'hasSnippet'],
                searchableAttributes: ['subject', 'from', 'snippet', 'fromDomain']
            })
        });

        if (!settingsResponse.ok) {
            console.error('Failed to update email index settings:', await settingsResponse.text());
        } else {
            console.log('Email index settings updated for faceted search');
        }

        // Add documents in batches to avoid overwhelming Meilisearch
        const batchSize = 1000;
        let processed = 0;

        for (let i = 0; i < emails.length; i += batchSize) {
            const batch = emails.slice(i, i + batchSize);

            const documentsResponse = await fetch(`${MEILISEARCH_URL}/indexes/emails/documents`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(MEILISEARCH_API_KEY && { 'Authorization': `Bearer ${MEILISEARCH_API_KEY}` })
                },
                body: JSON.stringify(batch)
            });

            if (!documentsResponse.ok) {
                console.error(`Failed to add email batch ${i / batchSize + 1}:`, await documentsResponse.text());
                continue;
            }

            processed += batch.length;
            console.log(`Indexed ${processed}/${emails.length} emails`);
        }

        console.log('All emails indexed successfully!');

        // Wait a moment for indexing to complete
        console.log('\nWaiting for indexing to complete...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Test email searches
        console.log('\n=== Testing Email Search ===\n');

        // 1. Simple search
        console.log('1. Search for emails containing "meeting":');
        await performEmailSearch({
            q: 'meeting',
            limit: 3
        });

        // 2. Filter by domain
        console.log('\n2. Emails from Gmail accounts:');
        await performEmailSearch({
            q: '',
            filter: 'fromDomain = "gmail.com"',
            limit: 3
        });

        // 3. Get facet distribution
        console.log('\n3. Distribution of emails by domain and day of week:');
        await performEmailSearch({
            q: '',
            facets: ['fromDomain', 'dayOfWeek', 'year', 'hasSnippet'],
            limit: 0
        });

        // 4. Recent emails with snippets
        console.log('\n4. Recent emails with snippets:');
        await performEmailSearch({
            q: '',
            filter: 'hasSnippet = true',
            sort: ['syncedAt:desc'],
            limit: 3
        });

    } catch (error) {
        console.error('Error indexing emails:', error);
    }
}

async function readAndIndexEmails() {
    console.log("Starting to read emails from database...");
    const startTime = Date.now();

    try {
        // Query all emails
        const result = await adminDb.query({
            emails: {
                $: {}
            }
        });

        if (!result.emails || result.emails.length === 0) {
            console.log("No emails found to index");
            return;
        }

        console.log(`Found ${result.emails.length} emails to index`);

        // Transform emails for Meilisearch
        const emailDocuments: EmailDocument[] = result.emails.map(email => {
            const dateInfo = parseEmailDate(email.date);
            return {
                ...email,
                fromDomain: extractEmailDomain(email.from),
                dayOfWeek: dateInfo.dayOfWeek,
                year: dateInfo.year,
                month: dateInfo.month,
                hasSnippet: Boolean(email.snippet && email.snippet.trim().length > 0),
            };
        });

        console.log('\nIndexing emails to Meilisearch...');
        await indexEmailsToMeilisearch(emailDocuments);

        const endTime = Date.now();
        const duration = endTime - startTime;
        console.log(`\nEmail indexing completed successfully in ${duration}ms (${(duration / 1000).toFixed(2)}s)`);

    } catch (error) {
        console.error("Error reading and indexing emails:", error);
        throw error;
    }
}

// Execute the function
readAndIndexEmails()
    .then(() => {
        console.log("Email indexing completed successfully");
        process.exit(0);
    })
    .catch((error) => {
        console.error("Email indexing failed:", error);
        process.exit(1);
    }); 