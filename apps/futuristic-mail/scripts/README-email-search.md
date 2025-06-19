# Email Search System

This system allows you to index and search through emails using Meilisearch.

## Setup

1. **Install and start Meilisearch:**
   ```bash
   # Install Meilisearch
   curl -L https://install.meilisearch.com | sh
   
   # Start Meilisearch
   ./meilisearch --master-key your-master-key
   ```

2. **Set environment variables:**
   ```bash
   # In your .env.local file
   MEILISEARCH_URL=http://localhost:7700
   MEILISEARCH_API_KEY=your-master-key
   INSTANT_ADMIN_TOKEN=your-instant-admin-token
   ```

3. **Index your emails:**
   ```bash
   cd apps/futuristic-mail
   npx tsx scripts/index-emails.ts
   ```

4. **Visit the search page:**
   Navigate to `http://localhost:3000/dev/search`

## Features

### Email Indexing Script (`scripts/index-emails.ts`)
- Reads all emails from InstantDB
- Enriches emails with additional searchable fields:
  - `fromDomain`: Email domain (e.g., "gmail.com")
  - `dayOfWeek`: Day the email was sent
  - `year`/`month`: Date components for filtering
  - `hasSnippet`: Whether the email has preview text
- Indexes emails in batches for performance
- Provides test searches after indexing

### Search Interface (`/dev/search`)
- **Full-text search**: Search email subjects, senders, and content
- **Faceted filtering**:
  - Filter by email domain
  - Filter by year
  - Filter by day of week
  - Filter by content preview availability
- **Real-time search**: Results update as you type
- **Highlighted search terms**: Search terms are highlighted in results
- **Responsive design**: Works on desktop and mobile

### API Route (`/api/search/emails`)
- Proxies search requests to Meilisearch
- Handles both GET and POST requests
- Includes proper error handling

## Usage Examples

### Search by keyword
```
meeting agenda
```

### Search with filters
- Search for "report" emails from Gmail accounts sent on Mondays
- Filter by year to find emails from 2023
- Show only emails with content previews

### Advanced Meilisearch features supported
- Faceted search for analytics
- Sorting by date or relevance
- Pagination for large result sets
- Typo tolerance for fuzzy matching

## Performance

- Indexing: ~1000 emails per batch
- Search: Sub-millisecond response times
- Scales to millions of emails

## Troubleshooting

1. **"No results found"**: Make sure Meilisearch is running and emails are indexed
2. **"Search failed"**: Check that your API key is correct
3. **"No emails to index"**: Verify your InstantDB has email data
4. **Slow indexing**: Reduce batch size in the script if needed 