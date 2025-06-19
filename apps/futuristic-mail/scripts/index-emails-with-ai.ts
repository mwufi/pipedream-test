import adminDb from "@/lib/instant_serverside_db";

const MEILISEARCH_URL = 'http://localhost:7700';
const MEILISEARCH_API_KEY = 'your-master-key'; // Replace with your actual key if you have one
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Make sure to set this in your environment

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

async function performHybridEmailSearch(params: any) {
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

    const searchResponse = await fetch(`${MEILISEARCH_URL}/indexes/emails-ai/search?${queryParams}`, {
        headers: {
            'Content-Type': 'application/json',
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
                    if (hit._semanticScore !== undefined) {
                        console.log(`    Semantic Score: ${hit._semanticScore.toFixed(4)}`);
                    }
                }
            });
        } else {
            console.log('No email results found');
        }
    } else {
        console.error('Email search failed:', await searchResponse.text());
    }
}

async function setupAIEmbedder() {
    if (!OPENAI_API_KEY) {
        console.error('OPENAI_API_KEY environment variable is required for AI-powered search');
        console.log('Please set your OpenAI API key in your environment variables');
        return false;
    }

    console.log('Setting up AI embedder for semantic search...');

    try {
        // Configure the embedder with OpenAI
        const embedderResponse = await fetch(`${MEILISEARCH_URL}/indexes/emails-ai/settings/embedders`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(MEILISEARCH_API_KEY && { 'Authorization': `Bearer ${MEILISEARCH_API_KEY}` })
            },
            body: JSON.stringify({
                "emails-openai": {
                    "source": "openAi",
                    "model": "text-embedding-3-small",
                    "apiKey": OPENAI_API_KEY,
                    "documentTemplate": "Email from '{{doc.from}}' with subject '{{doc.subject}}' containing: {{doc.snippet}} sent on {{doc.date}}"
                }
            })
        });

        if (!embedderResponse.ok) {
            console.error('Failed to setup embedder:', await embedderResponse.text());
            return false;
        }

        console.log('✅ AI embedder configured successfully');

        // Wait for the embedder to be ready
        console.log('Waiting for embedder to initialize...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        return true;
    } catch (error) {
        console.error('Error setting up embedder:', error);
        return false;
    }
}

async function indexEmailsWithAI(emails: EmailDocument[]) {
    try {
        // Create or update the AI-powered index
        const indexResponse = await fetch(`${MEILISEARCH_URL}/indexes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(MEILISEARCH_API_KEY && { 'Authorization': `Bearer ${MEILISEARCH_API_KEY}` })
            },
            body: JSON.stringify({
                uid: 'emails-ai',
                primaryKey: 'id'
            })
        });

        if (!indexResponse.ok && indexResponse.status !== 409) {
            console.error('Failed to create emails-ai index:', await indexResponse.text());
            return;
        }

        console.log('✅ AI-powered emails index created or already exists');

        // Setup AI embedder first
        const embedderReady = await setupAIEmbedder();
        if (!embedderReady) {
            console.log('❌ Skipping AI setup, falling back to regular search only');
        }

        // Configure index settings
        const settingsResponse = await fetch(`${MEILISEARCH_URL}/indexes/emails-ai/settings`, {
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
            console.error('Failed to update AI index settings:', await settingsResponse.text());
        } else {
            console.log('✅ AI index settings updated');
        }

        // Add documents in batches
        const batchSize = 100; // Smaller batches for AI processing
        let processed = 0;

        console.log(`\nIndexing ${emails.length} emails with AI embeddings...`);
        console.log('⚠️  This may take several minutes due to OpenAI API processing time');

        for (let i = 0; i < emails.length; i += batchSize) {
            const batch = emails.slice(i, i + batchSize);

            console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(emails.length / batchSize)} (${batch.length} emails)...`);

            const documentsResponse = await fetch(`${MEILISEARCH_URL}/indexes/emails-ai/documents`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(MEILISEARCH_API_KEY && { 'Authorization': `Bearer ${MEILISEARCH_API_KEY}` })
                },
                body: JSON.stringify(batch)
            });

            if (!documentsResponse.ok) {
                console.error(`Failed to add AI email batch ${i / batchSize + 1}:`, await documentsResponse.text());
                continue;
            }

            processed += batch.length;
            console.log(`✅ Indexed ${processed}/${emails.length} emails`);

            // Small delay between batches to avoid rate limiting
            if (i + batchSize < emails.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log('✅ All emails indexed with AI capabilities!');
        console.log('\n⏳ Waiting for AI embeddings to be generated...');
        console.log('This may take several minutes depending on the number of emails.');

        // Wait longer for AI processing
        await new Promise(resolve => setTimeout(resolve, 10000));

        // Test searches
        console.log('\n=== Testing AI-Powered Email Search ===\n');

        // 1. Semantic search
        console.log('1. Semantic search for "project deadline urgent":');
        await performHybridEmailSearch({
            q: 'project deadline urgent',
            hybridEmbedder: 'emails-openai',
            hybridSemanticRatio: 1.0,
            limit: 3
        });

        // 2. Traditional search
        console.log('\n2. Traditional search for "meeting":');
        await performHybridEmailSearch({
            q: 'meeting',
            limit: 3
        });

        // 3. Hybrid search with filters
        console.log('\n3. Hybrid semantic search with domain filter:');
        await performHybridEmailSearch({
            q: 'important announcement',
            hybridEmbedder: 'emails-openai',
            hybridSemanticRatio: 0.5,
            filter: 'fromDomain = "gmail.com"',
            limit: 3
        });

        // 4. Get facet distribution
        console.log('\n4. Distribution with AI search:');
        await performHybridEmailSearch({
            q: '',
            facets: ['fromDomain', 'dayOfWeek', 'year', 'hasSnippet'],
            limit: 0
        });

    } catch (error) {
        console.error('Error indexing emails with AI:', error);
    }
}

async function readAndIndexEmailsWithAI() {
    console.log("🚀 Starting AI-powered email indexing...");
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

        console.log(`📧 Found ${result.emails.length} emails to index with AI`);

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

        await indexEmailsWithAI(emailDocuments);

        const endTime = Date.now();
        const duration = endTime - startTime;
        console.log(`\n🎉 AI-powered email indexing completed in ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
        console.log(`\n🔍 Your emails are now searchable with both traditional and semantic search!`);
        console.log(`Visit /dev/search to try it out!`);

    } catch (error) {
        console.error("❌ Error reading and indexing emails with AI:", error);
        throw error;
    }
}

// Execute the function
readAndIndexEmailsWithAI()
    .then(() => {
        console.log("✅ AI email indexing completed successfully");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ AI email indexing failed:", error);
        process.exit(1);
    }); 