# AI-Powered Email Search System

This system allows you to index and search through emails using Meilisearch with AI semantic search capabilities.

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
   OPENAI_API_KEY=your-openai-api-key  # Required for AI features
   ```

3. **Index your emails with AI:**
   ```bash
   cd apps/futuristic-mail
   
   # For basic search (faster)
   npx tsx scripts/index-emails.ts
   
   # For AI-powered search (recommended, but slower)
   npx tsx scripts/index-emails-with-ai.ts
   ```

4. **Visit the search page:**
   Navigate to `http://localhost:3000/dev/search`

## 🚀 New Features

### AI-Powered Semantic Search
- **Understanding Context**: Search by meaning, not just keywords
- **Example**: Search "urgent deadline" and find emails about "time-sensitive projects" or "due dates"
- **Smart Results**: AI scores show relevance based on semantic similarity

### Real-Time Search
- **Search as you Type**: Results update instantly as you type (300ms debounce)
- **No More Submit Button**: Just start typing and see results immediately
- **Live Filtering**: Filters update results in real-time too

### Three Search Modes
1. **📝 Traditional**: Classic keyword matching
2. **🧠 AI Semantic**: Pure AI-powered meaning-based search
3. **⚡ Hybrid**: Best of both worlds (recommended)

## Features

### Email Indexing Scripts

#### Basic Script (`scripts/index-emails.ts`)
- Traditional full-text search capabilities
- Fast indexing and searching
- Great for exact keyword matching

#### AI-Enhanced Script (`scripts/index-emails-with-ai.ts`)
- **OpenAI Integration**: Uses `text-embedding-3-small` model
- **Smart Document Templates**: Optimized prompts for email content
- **Semantic Embeddings**: AI-generated vector representations
- **Hybrid Search**: Combines traditional and semantic search
- **Batch Processing**: Efficient handling of large email datasets

### Search Interface (`/dev/search`)
- **🔍 Real-time search**: Search as you type with intelligent debouncing
- **🧠 AI semantic search**: Find emails by meaning and context
- **📝 Traditional search**: Exact keyword matching when needed
- **⚡ Hybrid mode**: Best results combining both approaches
- **🎯 Smart scoring**: AI relevance scores for semantic matches
- **🔧 Advanced filtering**: All previous filters plus AI-aware features
- **📱 Responsive design**: Works perfectly on all devices

## Usage Examples

### Semantic Search Examples
```
# Traditional keyword search
"meeting tomorrow"

# Semantic search finds these conceptually similar emails:
- "conference call scheduled for Wednesday"
- "team sync next day"  
- "appointment set for tomorrow morning"
```

```
# Search: "urgent project deadline"
# AI finds emails about:
- "time-sensitive deliverable due soon"
- "critical milestone approaching"
- "high priority task completion"
```

### Search Modes Comparison
- **Traditional**: "budget report" → finds emails with exactly "budget" and "report"
- **Semantic**: "budget report" → finds emails about financial summaries, cost analysis, expense reviews
- **Hybrid**: Combines both for comprehensive results

### Real-Time Features
- Start typing immediately - no need to press search
- Results update as you type (300ms delay to avoid spam)
- Filters apply instantly when changed
- Loading indicators show search progress

## Performance

### Basic Search
- Indexing: ~1000 emails per batch
- Search: Sub-millisecond response times
- Scales to millions of emails

### AI-Powered Search
- Indexing: ~100 emails per batch (due to OpenAI API calls)
- Initial setup: Several minutes for embedding generation
- Search: Still sub-second, even with AI
- Requires OpenAI API key and credits

## API Reference

### Search Modes
```javascript
// Traditional search
{ q: "search term" }

// Semantic search  
{ 
  q: "search term",
  hybridEmbedder: "emails-openai",
  hybridSemanticRatio: 1.0
}

// Hybrid search (recommended)
{ 
  q: "search term",
  hybridEmbedder: "emails-openai", 
  hybridSemanticRatio: 0.5
}
```

## Troubleshooting

### General Issues
1. **"No results found"**: Make sure Meilisearch is running and emails are indexed
2. **"Search failed"**: Check that your API key is correct
3. **"No emails to index"**: Verify your InstantDB has email data

### AI-Specific Issues
4. **"OPENAI_API_KEY required"**: Set your OpenAI API key in environment variables
5. **"Embedder setup failed"**: Check your OpenAI API key and account status
6. **Slow AI indexing**: Normal - OpenAI API has rate limits, be patient
7. **"AI search not working"**: Make sure you used `index-emails-with-ai.ts` script

### Performance Tips
- Use traditional search for exact matches
- Use semantic search for concept-based queries  
- Hybrid mode gives best overall results
- Smaller batches if you hit OpenAI rate limits

## Cost Considerations

**OpenAI API Usage:**
- `text-embedding-3-small` model: ~$0.02 per 1M tokens
- Average email: ~100-200 tokens
- 1000 emails ≈ $0.002-0.004 in API costs
- One-time indexing cost, searches are free after that

The AI features are optional - you can always fall back to traditional search! 