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
          
          files.push({
            id: relativePath.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 500), // Valid ID generation
            path: relativePath,
            filename: entry.name,
            content: content.substring(0, 50000), // Limit content size
            extension: extension,
            size: content.length
          });
        } catch (error) {
          console.error(`Error reading file ${fullPath}:`, error);
        }
      }
    }
  }
  
  return files;
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
    
    // Test search
    console.log('\nTesting search for "pipedream"...');
    const searchResponse = await fetch(`${MEILISEARCH_URL}/indexes/code-files/search?q=pipedream&limit=5`, {
      headers: {
        ...(MEILISEARCH_API_KEY && { 'Authorization': `Bearer ${MEILISEARCH_API_KEY}` })
      }
    });
    
    if (searchResponse.ok) {
      const searchResults = await searchResponse.json();
      console.log(`Found ${searchResults.estimatedTotalHits} results:`);
      searchResults.hits.forEach((hit: any) => {
        console.log(`- ${hit.path} (${hit.size} bytes)`);
      });
    }
    
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