import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

const MEILISEARCH_URL = 'http://localhost:7700';
const MEILISEARCH_API_KEY = 'your-master-key'; // Replace with your actual key if you have one

interface CodeFile {
  id: string;
  path: string;
  filename: string;
  content: string;
  extension: string;
  size: number;
  directory: string;
  sizeCategory: string;
  language: string;
}

async function getAllCodeFiles(dir: string, files: CodeFile[] = []): Promise<CodeFile[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    
    // Skip node_modules, .git, and other common directories
    if (entry.isDirectory()) {
      if (!['node_modules', '.git', '.next', 'dist', 'build', '.turbo'].includes(entry.name)) {
        await getAllCodeFiles(fullPath, files);
      }
    } else if (entry.isFile()) {
      // Include common code file extensions
      const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.css', '.html'];
      const extension = entry.name.substring(entry.name.lastIndexOf('.'));
      
      if (codeExtensions.includes(extension)) {
        try {
          const content = await readFile(fullPath, 'utf-8');
          const relativePath = fullPath.replace(process.cwd(), '');
          
          // Extract directory
          const pathParts = relativePath.split('/').filter(p => p);
          const directory = pathParts.length > 1 ? `/${pathParts.slice(0, -1).join('/')}` : '/';
          
          // Categorize by size
          let sizeCategory = 'tiny';
          if (content.length > 10000) sizeCategory = 'large';
          else if (content.length > 1000) sizeCategory = 'medium';
          else if (content.length > 100) sizeCategory = 'small';
          
          // Map extension to language
          const languageMap: Record<string, string> = {
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.json': 'json',
            '.md': 'markdown',
            '.css': 'css',
            '.html': 'html'
          };
          
          files.push({
            id: relativePath.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 500), // Valid ID generation
            path: relativePath,
            filename: entry.name,
            content: content.substring(0, 50000), // Limit content size
            extension: extension,
            size: content.length,
            directory: directory,
            sizeCategory: sizeCategory,
            language: languageMap[extension] || 'other'
          });
        } catch (error) {
          console.error(`Error reading file ${fullPath}:`, error);
        }
      }
    }
  }
  
  return files;
}

async function performSearch(params: any) {
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
  
  const searchResponse = await fetch(`${MEILISEARCH_URL}/indexes/code-files/search?${queryParams}`, {
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
          console.log(`    ${value}: ${count} files`);
        });
      });
    } else if (results.hits.length > 0) {
      console.log(`Found ${results.estimatedTotalHits} results:`);
      results.hits.forEach((hit: any) => {
        console.log(`  - ${hit.path}`);
        console.log(`    Language: ${hit.language}, Size: ${hit.size} bytes (${hit.sizeCategory})`);
      });
    } else {
      console.log('No results found');
    }
  } else {
    console.error('Search failed:', await searchResponse.text());
  }
}

async function indexToMeilisearch(files: CodeFile[]) {
  try {
    // Create or update the index
    const indexResponse = await fetch(`${MEILISEARCH_URL}/indexes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(MEILISEARCH_API_KEY && { 'Authorization': `Bearer ${MEILISEARCH_API_KEY}` })
      },
      body: JSON.stringify({
        uid: 'code-files',
        primaryKey: 'id'
      })
    });
    
    if (!indexResponse.ok && indexResponse.status !== 409) {
      console.error('Failed to create index:', await indexResponse.text());
      return;
    }
    
    console.log('Index created or already exists');
    
    // Configure filterable attributes for faceted search
    const settingsResponse = await fetch(`${MEILISEARCH_URL}/indexes/code-files/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(MEILISEARCH_API_KEY && { 'Authorization': `Bearer ${MEILISEARCH_API_KEY}` })
      },
      body: JSON.stringify({
        filterableAttributes: ['extension', 'directory', 'sizeCategory', 'language'],
        sortableAttributes: ['size'],
        displayedAttributes: ['id', 'path', 'filename', 'extension', 'size', 'directory', 'sizeCategory', 'language'],
        searchableAttributes: ['filename', 'content', 'path']
      })
    });
    
    if (!settingsResponse.ok) {
      console.error('Failed to update settings:', await settingsResponse.text());
    } else {
      console.log('Index settings updated for faceted search');
    }
    
    // Add documents
    const documentsResponse = await fetch(`${MEILISEARCH_URL}/indexes/code-files/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(MEILISEARCH_API_KEY && { 'Authorization': `Bearer ${MEILISEARCH_API_KEY}` })
      },
      body: JSON.stringify(files)
    });
    
    if (!documentsResponse.ok) {
      console.error('Failed to add documents:', await documentsResponse.text());
      return;
    }
    
    const result = await documentsResponse.json();
    console.log('Documents added successfully:', result);
    
    // Wait for the indexing task to complete
    console.log('\nWaiting for indexing to complete...');
    const taskUid = result.taskUid;
    let taskComplete = false;
    
    while (!taskComplete) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const taskResponse = await fetch(`${MEILISEARCH_URL}/tasks/${taskUid}`, {
        headers: {
          ...(MEILISEARCH_API_KEY && { 'Authorization': `Bearer ${MEILISEARCH_API_KEY}` })
        }
      });
      
      if (taskResponse.ok) {
        const taskStatus = await taskResponse.json();
        console.log(`Task status: ${taskStatus.status}`);
        
        if (taskStatus.status === 'succeeded') {
          taskComplete = true;
          console.log('Indexing completed successfully!');
        } else if (taskStatus.status === 'failed') {
          console.error('Indexing failed:', taskStatus.error);
          return;
        }
      }
    }
    
    // Test various faceted searches
    console.log('\n=== Testing Faceted Search ===\n');
    
    // 1. Simple search
    console.log('1. Search for "pipedream":');
    await performSearch({
      q: 'pipedream',
      limit: 3
    });
    
    // 2. Filter by TypeScript files only
    console.log('\n2. Search for "pipedream" in TypeScript files only:');
    await performSearch({
      q: 'pipedream',
      filter: 'language = "typescript"',
      limit: 3
    });
    
    // 3. JSON files that are medium or large
    console.log('\n3. JSON files that are medium or large:');
    await performSearch({
      q: '',
      filter: 'language = "json" AND (sizeCategory = "medium" OR sizeCategory = "large")',
      limit: 5
    });
    
    // 4. Get facet distribution
    console.log('\n4. Get distribution of files by language:');
    await performSearch({
      q: '',
      facets: ['language', 'sizeCategory', 'extension'],
      limit: 0
    });
    
    // 5. Complex filter
    console.log('\n5. TypeScript or JavaScript files that are medium or large:');
    await performSearch({
      q: '',
      filter: '(language = "typescript" OR language = "javascript") AND (sizeCategory = "medium" OR sizeCategory = "large")',
      sort: ['size:desc'],
      limit: 5
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

async function main() {
  console.log('Scanning for code files...');
  const files = await getAllCodeFiles(process.cwd());
  console.log(`Found ${files.length} code files`);
  
  console.log('\nIndexing to Meilisearch...');
  await indexToMeilisearch(files);
}

main().catch(console.error);