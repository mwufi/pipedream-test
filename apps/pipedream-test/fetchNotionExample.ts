#!/usr/bin/env bun

/**
 * Notion API Helper Script
 * Run with: bun run fetchNotionExample.ts
 * 
 * This script helps you explore the Notion API through Pipedream proxy
 */

interface NotionExample {
  name: string;
  description: string;
  execute: () => Promise<any>;
}

// Configuration
const API_BASE = "http://localhost:3000/api/pipedream/proxy";
const USER_ID = "test-user-123";
const NOTION_VERSION = "2022-06-28";

// You'll need to set this to your actual Notion account ID from Pipedream
// Run the script once to see your account ID in the error message
let NOTION_ACCOUNT_ID = "";

// Optional: Set these to specific IDs to test
let SAMPLE_PAGE_ID = "1f86a2ad-6fcc-8024-aae3-e0c9f2bb4994";
let SAMPLE_DATABASE_ID = "";

async function makeNotionRequest(
  method: string,
  endpoint: string,
  body?: any
): Promise<any> {
  try {
    const response = await fetch(API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        account_id: NOTION_ACCOUNT_ID,
        external_user_id: USER_ID,
        target_url: `https://api.notion.com/v1${endpoint}`,
        method: method,
        headers: {
          "Notion-Version": NOTION_VERSION,
        },
        body: body,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }

    return data.data;
  } catch (error) {
    console.error(`❌ Error making request to ${endpoint}:`, error);
    throw error;
  }
}

// Get accounts to find Notion account ID
async function getAccounts() {
  try {
    const response = await fetch(
      `http://localhost:3000/api/pipedream/accounts?external_user_id=${USER_ID}`
    );
    const data = await response.json();
    const accounts = Array.isArray(data) ? data : data.data || [];
    
    const notionAccount = accounts.find((acc: any) => acc.app.name_slug === "notion");
    
    if (notionAccount) {
      NOTION_ACCOUNT_ID = notionAccount.id;
      console.log(`✅ Found Notion account: ${notionAccount.name} (${notionAccount.id})`);
      return true;
    } else {
      console.log("❌ No Notion account found. Available accounts:");
      accounts.forEach((acc: any) => {
        console.log(`   - ${acc.app.name}: ${acc.name} (${acc.id})`);
      });
      return false;
    }
  } catch (error) {
    console.error("❌ Error fetching accounts:", error);
    return false;
  }
}

const examples: NotionExample[] = [
  {
    name: "1. Get Current User",
    description: "Get information about the bot user",
    execute: async () => {
      const user = await makeNotionRequest("GET", "/users/me");
      console.log("Bot user:", {
        id: user.id,
        name: user.name,
        type: user.type,
        avatar_url: user.avatar_url,
      });
      return user;
    },
  },

  {
    name: "2. List All Users",
    description: "List all users in the workspace",
    execute: async () => {
      const response = await makeNotionRequest("GET", "/users");
      console.log(`Found ${response.results.length} users:`);
      response.results.forEach((user: any) => {
        console.log(`  - ${user.name || "Unnamed"} (${user.type})`);
      });
      return response;
    },
  },

  {
    name: "3. Search All Content",
    description: "Search all pages and databases",
    execute: async () => {
      const response = await makeNotionRequest("POST", "/search", {
        page_size: 5,
        sort: {
          direction: "descending",
          timestamp: "last_edited_time",
        },
      });
      
      console.log(`Found ${response.results.length} items:`);
      response.results.forEach((item: any) => {
        const title = item.properties?.title?.title?.[0]?.plain_text || 
                      item.properties?.Name?.title?.[0]?.plain_text || 
                      item.title?.[0]?.plain_text ||
                      "Untitled";
        console.log(`  - [${item.object}] ${title} (${item.id})`);
        
        // Store IDs for later examples
        if (item.object === "page" && !SAMPLE_PAGE_ID) {
          SAMPLE_PAGE_ID = item.id;
        }
        if (item.object === "database" && !SAMPLE_DATABASE_ID) {
          SAMPLE_DATABASE_ID = item.id;
        }
      });
      
      return response;
    },
  },

  {
    name: "4. Search Pages Only",
    description: "Search only for pages",
    execute: async () => {
      const response = await makeNotionRequest("POST", "/search", {
        filter: {
          property: "object",
          value: "page",
        },
        page_size: 5,
      });
      
      console.log(`Found ${response.results.length} pages:`);
      response.results.forEach((page: any) => {
        const title = getPageTitle(page);
        console.log(`  - ${title} (${page.id})`);
        console.log(`    Created: ${new Date(page.created_time).toLocaleDateString()}`);
        console.log(`    Last edited: ${new Date(page.last_edited_time).toLocaleDateString()}`);
      });
      
      return response;
    },
  },

  {
    name: "5. Search Databases Only",
    description: "Search only for databases",
    execute: async () => {
      const response = await makeNotionRequest("POST", "/search", {
        filter: {
          property: "object",
          value: "database",
        },
        page_size: 5,
      });
      
      console.log(`Found ${response.results.length} databases:`);
      response.results.forEach((db: any) => {
        const title = db.title?.[0]?.plain_text || "Untitled Database";
        console.log(`  - ${title} (${db.id})`);
        console.log(`    Properties: ${Object.keys(db.properties || {}).join(", ")}`);
      });
      
      return response;
    },
  },

  {
    name: "6. Get Page Content",
    description: "Get a specific page's properties",
    execute: async () => {
      if (!SAMPLE_PAGE_ID) {
        console.log("No page ID available. Run example 3 first to find pages.");
        return null;
      }
      
      const page = await makeNotionRequest("GET", `/pages/${SAMPLE_PAGE_ID}`);
      console.log("Page details:");
      console.log(`  ID: ${page.id}`);
      console.log(`  Created: ${new Date(page.created_time).toLocaleDateString()}`);
      console.log(`  Last edited: ${new Date(page.last_edited_time).toLocaleDateString()}`);
      console.log(`  Properties:`, Object.keys(page.properties || {}));
      
      return page;
    },
  },

  {
    name: "7. Get Page Blocks",
    description: "Get all blocks (content) from a page",
    execute: async () => {
      if (!SAMPLE_PAGE_ID) {
        console.log("No page ID available. Run example 3 first to find pages.");
        return null;
      }
      
      const response = await makeNotionRequest(
        "GET",
        `/blocks/${SAMPLE_PAGE_ID}/children?page_size=100`
      );
      
      console.log(`Found ${response.results.length} blocks:`);
      response.results.forEach((block: any, index: number) => {
        console.log(`  ${index + 1}. [${block.type}]`);
        
        // Extract text content based on block type
        const text = extractBlockText(block);
        if (text) {
          console.log(`     "${text}"`);
        }
      });
      
      return response;
    },
  },

  {
    name: "8. Get Database Schema",
    description: "Get database properties and schema",
    execute: async () => {
      if (!SAMPLE_DATABASE_ID) {
        console.log("No database ID available. Run example 3 first to find databases.");
        return null;
      }
      
      const db = await makeNotionRequest("GET", `/databases/${SAMPLE_DATABASE_ID}`);
      const title = db.title?.[0]?.plain_text || "Untitled Database";
      
      console.log(`Database: ${title}`);
      console.log("Properties:");
      
      Object.entries(db.properties || {}).forEach(([name, prop]: [string, any]) => {
        console.log(`  - ${name} (${prop.type})`);
        
        // Show options for select/multi-select
        if (prop.type === "select" && prop.select?.options) {
          console.log(`    Options: ${prop.select.options.map((o: any) => o.name).join(", ")}`);
        }
        if (prop.type === "multi_select" && prop.multi_select?.options) {
          console.log(`    Options: ${prop.multi_select.options.map((o: any) => o.name).join(", ")}`);
        }
      });
      
      return db;
    },
  },

  {
    name: "9. Query Database",
    description: "Query database with sorting",
    execute: async () => {
      if (!SAMPLE_DATABASE_ID) {
        console.log("No database ID available. Run example 3 first to find databases.");
        return null;
      }
      
      const response = await makeNotionRequest(
        "POST",
        `/databases/${SAMPLE_DATABASE_ID}/query`,
        {
          page_size: 5,
          sorts: [
            {
              timestamp: "created_time",
              direction: "descending",
            },
          ],
        }
      );
      
      console.log(`Found ${response.results.length} items:`);
      response.results.forEach((item: any) => {
        const title = getPageTitle(item);
        console.log(`  - ${title}`);
        
        // Show some properties
        Object.entries(item.properties || {}).forEach(([key, value]: [string, any]) => {
          const propValue = getPropertyValue(value);
          if (propValue) {
            console.log(`    ${key}: ${propValue}`);
          }
        });
      });
      
      return response;
    },
  },
];

// Helper functions
function getPageTitle(page: any): string {
  // Try different common property names for title
  const titleProps = ["title", "Title", "Name", "name"];
  
  for (const prop of titleProps) {
    if (page.properties?.[prop]?.title?.[0]?.plain_text) {
      return page.properties[prop].title[0].plain_text;
    }
  }
  
  return "Untitled";
}

function extractBlockText(block: any): string {
  const type = block.type;
  const content = block[type];
  
  if (!content) return "";
  
  // Handle rich text arrays
  if (content.rich_text && Array.isArray(content.rich_text)) {
    return content.rich_text.map((rt: any) => rt.plain_text).join("");
  }
  
  // Handle text arrays (older format)
  if (content.text && Array.isArray(content.text)) {
    return content.text.map((t: any) => t.plain_text).join("");
  }
  
  return "";
}

function getPropertyValue(prop: any): string {
  switch (prop.type) {
    case "title":
      return prop.title?.[0]?.plain_text || "";
    case "rich_text":
      return prop.rich_text?.[0]?.plain_text || "";
    case "number":
      return prop.number?.toString() || "";
    case "select":
      return prop.select?.name || "";
    case "multi_select":
      return prop.multi_select?.map((s: any) => s.name).join(", ") || "";
    case "date":
      return prop.date?.start || "";
    case "checkbox":
      return prop.checkbox ? "✓" : "✗";
    case "url":
      return prop.url || "";
    case "email":
      return prop.email || "";
    case "phone_number":
      return prop.phone_number || "";
    default:
      return "";
  }
}

// Main execution
async function main() {
  console.log("🚀 Notion API Explorer");
  console.log("=====================\n");

  // First, get the Notion account
  const hasAccount = await getAccounts();
  if (!hasAccount) {
    console.log("\n❌ Please connect a Notion account at http://localhost:3000/me");
    return;
  }

  console.log("\n");

  // Check for command line argument
  const exampleNumber = process.argv[2];
  
  if (exampleNumber) {
    // Run specific example
    const index = parseInt(exampleNumber) - 1;
    if (index >= 0 && index < examples.length) {
      const example = examples[index];
      console.log(`Running: ${example.name}`);
      console.log(`${example.description}\n`);
      
      try {
        await example.execute();
      } catch (error) {
        console.error("Failed to execute example");
      }
    } else {
      console.log(`Invalid example number. Available examples: 1-${examples.length}`);
    }
  } else {
    // Interactive menu
    console.log("Available examples:");
    examples.forEach((ex, i) => {
      console.log(`  ${ex.name}`);
    });
    
    console.log("\nUsage:");
    console.log("  bun run fetchNotionExample.ts        # Show this menu");
    console.log("  bun run fetchNotionExample.ts <num>  # Run specific example");
    console.log("  bun run fetchNotionExample.ts all    # Run all examples\n");
    
    console.log("Example: bun run fetchNotionExample.ts 3");
    
    // Run all if requested
    if (process.argv[2] === "all") {
      console.log("\nRunning all examples...\n");
      
      for (const example of examples) {
        console.log(`\n${"=".repeat(50)}`);
        console.log(`${example.name}`);
        console.log(`${example.description}`);
        console.log(`${"=".repeat(50)}\n`);
        
        try {
          await example.execute();
        } catch (error) {
          console.error("Failed to execute example");
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
}

// Run the script
main().catch(console.error);