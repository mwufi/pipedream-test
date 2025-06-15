#!/usr/bin/env bun

/**
 * Notion Database Writer
 * Run with: bun run writeToNotion.ts
 * 
 * This script helps you create pages in Notion databases
 */

interface DatabaseProperty {
  id: string;
  name: string;
  type: string;
  [key: string]: any;
}

// Configuration
const API_BASE = "http://localhost:3000/api/pipedream/proxy";
const USER_ID = "test-user-123";
const NOTION_VERSION = "2022-06-28";

let NOTION_ACCOUNT_ID = "";

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
      console.error("Error response:", data);
      throw new Error(data.error || "Request failed");
    }

    return data.data;
  } catch (error) {
    console.error(`❌ Error making request to ${endpoint}:`, error);
    throw error;
  }
}

// Get accounts to find Notion account ID
async function getAccounts(): Promise<boolean> {
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
      console.log("❌ No Notion account found.");
      return false;
    }
  } catch (error) {
    console.error("❌ Error fetching accounts:", error);
    return false;
  }
}

// Find databases in the workspace
async function findDatabases(): Promise<any[]> {
  const response = await makeNotionRequest("POST", "/search", {
    filter: {
      property: "object",
      value: "database",
    },
    page_size: 20,
  });
  
  return response.results || [];
}

// Get database schema
async function getDatabaseSchema(databaseId: string): Promise<any> {
  return await makeNotionRequest("GET", `/databases/${databaseId}`);
}

// Create a page in a database
async function createDatabasePage(databaseId: string, properties: any): Promise<any> {
  return await makeNotionRequest("POST", "/pages", {
    parent: {
      type: "database_id",
      database_id: databaseId,
    },
    properties: properties,
  });
}

// Generate sample data based on property type
function generateSampleValue(property: DatabaseProperty): any {
  switch (property.type) {
    case "title":
      return {
        title: [
          {
            type: "text",
            text: {
              content: `Test Page - ${new Date().toLocaleString()}`,
            },
          },
        ],
      };

    case "rich_text":
      return {
        rich_text: [
          {
            type: "text",
            text: {
              content: "This is a sample rich text field with some content.",
            },
          },
        ],
      };

    case "number":
      return {
        number: Math.floor(Math.random() * 100),
      };

    case "select":
      // Pick a random option if available
      if (property.select?.options?.length > 0) {
        const randomOption = property.select.options[Math.floor(Math.random() * property.select.options.length)];
        return {
          select: {
            name: randomOption.name,
          },
        };
      }
      return {
        select: {
          name: "Option 1",
        },
      };

    case "multi_select":
      // Pick 1-2 random options if available
      if (property.multi_select?.options?.length > 0) {
        const numOptions = Math.min(2, property.multi_select.options.length);
        const selectedOptions = property.multi_select.options
          .sort(() => Math.random() - 0.5)
          .slice(0, numOptions)
          .map((opt: any) => ({ name: opt.name }));
        
        return {
          multi_select: selectedOptions,
        };
      }
      return {
        multi_select: [
          { name: "Tag 1" },
          { name: "Tag 2" },
        ],
      };

    case "date":
      return {
        date: {
          start: new Date().toISOString().split('T')[0],
        },
      };

    case "checkbox":
      return {
        checkbox: Math.random() > 0.5,
      };

    case "url":
      return {
        url: "https://example.com",
      };

    case "email":
      return {
        email: "test@example.com",
      };

    case "phone_number":
      return {
        phone_number: "+1234567890",
      };

    case "people":
      // This would need actual user IDs
      return undefined;

    case "files":
      // Files need to be uploaded separately
      return undefined;

    default:
      return undefined;
  }
}

// Main interactive functions
async function interactiveCreatePage() {
  console.log("\n🔍 Finding databases in your workspace...\n");
  
  const databases = await findDatabases();
  
  if (databases.length === 0) {
    console.log("❌ No databases found in your workspace.");
    return;
  }

  console.log("Found databases:");
  databases.forEach((db: any, index: number) => {
    const title = db.title?.[0]?.plain_text || "Untitled Database";
    console.log(`  ${index + 1}. ${title}`);
    console.log(`     ID: ${db.id}`);
  });

  console.log("\nSelect a database (enter number):");
  const dbIndex = parseInt(await getUserInput()) - 1;
  
  if (dbIndex < 0 || dbIndex >= databases.length) {
    console.log("❌ Invalid selection");
    return;
  }

  const selectedDb = databases[dbIndex];
  const dbTitle = selectedDb.title?.[0]?.plain_text || "Untitled Database";
  
  console.log(`\n✅ Selected: ${dbTitle}`);
  console.log("\n📋 Getting database schema...\n");

  const schema = await getDatabaseSchema(selectedDb.id);
  
  console.log("Database properties:");
  const editableProps: [string, DatabaseProperty][] = [];
  
  Object.entries(schema.properties).forEach(([name, prop]: [string, any]) => {
    // Skip computed properties
    if (["created_time", "created_by", "last_edited_time", "last_edited_by"].includes(prop.type)) {
      return;
    }
    
    console.log(`  - ${name} (${prop.type})`);
    editableProps.push([name, prop]);
  });

  console.log("\nDo you want to:");
  console.log("  1. Create a page with sample data");
  console.log("  2. Create a page with custom data");
  console.log("  3. Create multiple pages with sample data");
  
  const choice = await getUserInput();

  switch (choice) {
    case "1":
      await createWithSampleData(selectedDb.id, editableProps);
      break;
    case "2":
      await createWithCustomData(selectedDb.id, editableProps);
      break;
    case "3":
      await createMultiplePages(selectedDb.id, editableProps);
      break;
    default:
      console.log("❌ Invalid choice");
  }
}

async function createWithSampleData(databaseId: string, properties: [string, DatabaseProperty][]) {
  console.log("\n🎲 Creating page with sample data...\n");
  
  const pageProperties: any = {};
  
  for (const [name, prop] of properties) {
    const value = generateSampleValue(prop);
    if (value !== undefined) {
      pageProperties[name] = value;
    }
  }

  try {
    const page = await createDatabasePage(databaseId, pageProperties);
    console.log("✅ Page created successfully!");
    console.log(`   ID: ${page.id}`);
    console.log(`   URL: ${page.url}`);
  } catch (error) {
    console.error("❌ Failed to create page:", error);
  }
}

async function createWithCustomData(databaseId: string, properties: [string, DatabaseProperty][]) {
  console.log("\n📝 Creating page with custom data...\n");
  
  const pageProperties: any = {};
  
  for (const [name, prop] of properties) {
    console.log(`\n${name} (${prop.type}):`);
    
    switch (prop.type) {
      case "title":
        console.log("Enter title:");
        const title = await getUserInput();
        pageProperties[name] = {
          title: [{ type: "text", text: { content: title } }],
        };
        break;

      case "rich_text":
        console.log("Enter text:");
        const text = await getUserInput();
        pageProperties[name] = {
          rich_text: [{ type: "text", text: { content: text } }],
        };
        break;

      case "number":
        console.log("Enter number:");
        const num = parseFloat(await getUserInput());
        if (!isNaN(num)) {
          pageProperties[name] = { number: num };
        }
        break;

      case "checkbox":
        console.log("Check? (y/n):");
        const check = await getUserInput();
        pageProperties[name] = { checkbox: check.toLowerCase() === 'y' };
        break;

      case "date":
        console.log("Enter date (YYYY-MM-DD) or press enter for today:");
        const dateInput = await getUserInput();
        pageProperties[name] = {
          date: { start: dateInput || new Date().toISOString().split('T')[0] },
        };
        break;

      case "select":
        if (prop.select?.options?.length > 0) {
          console.log("Available options:");
          prop.select.options.forEach((opt: any, i: number) => {
            console.log(`  ${i + 1}. ${opt.name}`);
          });
          console.log("Select option (number):");
          const optIndex = parseInt(await getUserInput()) - 1;
          if (optIndex >= 0 && optIndex < prop.select.options.length) {
            pageProperties[name] = {
              select: { name: prop.select.options[optIndex].name },
            };
          }
        } else {
          console.log("Enter value:");
          const value = await getUserInput();
          pageProperties[name] = { select: { name: value } };
        }
        break;

      default:
        console.log(`(Skipping ${prop.type} - not implemented)`);
    }
  }

  try {
    const page = await createDatabasePage(databaseId, pageProperties);
    console.log("\n✅ Page created successfully!");
    console.log(`   ID: ${page.id}`);
    console.log(`   URL: ${page.url}`);
  } catch (error) {
    console.error("❌ Failed to create page:", error);
  }
}

async function createMultiplePages(databaseId: string, properties: [string, DatabaseProperty][]) {
  console.log("\nHow many pages to create? (max 10):");
  const count = Math.min(10, parseInt(await getUserInput()) || 1);
  
  console.log(`\n🎲 Creating ${count} pages with sample data...\n`);
  
  for (let i = 0; i < count; i++) {
    const pageProperties: any = {};
    
    for (const [name, prop] of properties) {
      const value = generateSampleValue(prop);
      if (value !== undefined) {
        // Modify title to include index
        if (prop.type === "title" && value.title) {
          value.title[0].text.content = `Test Page ${i + 1} - ${new Date().toLocaleString()}`;
        }
        pageProperties[name] = value;
      }
    }

    try {
      const page = await createDatabasePage(databaseId, pageProperties);
      console.log(`✅ Page ${i + 1}/${count} created: ${page.url}`);
    } catch (error) {
      console.error(`❌ Failed to create page ${i + 1}:`, error);
    }

    // Small delay between requests
    if (i < count - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

// Utility function to get user input
async function getUserInput(): Promise<string> {
  for await (const line of console) {
    return line.trim();
  }
  return "";
}

// Bulk import functions
async function importFromJSON(databaseId: string, jsonFile: string) {
  console.log(`\n📥 Importing from ${jsonFile}...\n`);
  
  try {
    const data = await Bun.file(jsonFile).json();
    const items = Array.isArray(data) ? data : [data];
    
    const schema = await getDatabaseSchema(databaseId);
    
    console.log(`Found ${items.length} items to import`);
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const pageProperties: any = {};
      
      // Map JSON fields to Notion properties
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        const prop = propSchema as DatabaseProperty;
        const value = item[propName];
        
        if (value === undefined || value === null) continue;
        
        switch (prop.type) {
          case "title":
            pageProperties[propName] = {
              title: [{ type: "text", text: { content: String(value) } }],
            };
            break;
          case "rich_text":
            pageProperties[propName] = {
              rich_text: [{ type: "text", text: { content: String(value) } }],
            };
            break;
          case "number":
            pageProperties[propName] = { number: Number(value) };
            break;
          case "checkbox":
            pageProperties[propName] = { checkbox: Boolean(value) };
            break;
          case "date":
            pageProperties[propName] = { date: { start: String(value) } };
            break;
          case "select":
            pageProperties[propName] = { select: { name: String(value) } };
            break;
          case "multi_select":
            const tags = Array.isArray(value) ? value : [value];
            pageProperties[propName] = {
              multi_select: tags.map(tag => ({ name: String(tag) })),
            };
            break;
        }
      }
      
      try {
        const page = await createDatabasePage(databaseId, pageProperties);
        console.log(`✅ Imported ${i + 1}/${items.length}: ${page.id}`);
      } catch (error) {
        console.error(`❌ Failed to import item ${i + 1}:`, error);
      }
      
      // Rate limiting
      if (i < items.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    
    console.log("\n✅ Import completed!");
  } catch (error) {
    console.error("❌ Import failed:", error);
  }
}

// Main execution
async function main() {
  console.log("🚀 Notion Database Writer");
  console.log("========================\n");

  // First, get the Notion account
  const hasAccount = await getAccounts();
  if (!hasAccount) {
    console.log("\n❌ Please connect a Notion account at http://localhost:3000/me");
    return;
  }

  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Interactive mode
    await interactiveCreatePage();
  } else if (args[0] === "import" && args[1] && args[2]) {
    // Import mode: bun run writeToNotion.ts import <database-id> <json-file>
    await importFromJSON(args[1], args[2]);
  } else {
    console.log("\nUsage:");
    console.log("  bun run writeToNotion.ts                           # Interactive mode");
    console.log("  bun run writeToNotion.ts import <db-id> <file.json> # Import from JSON\n");
    console.log("Example JSON format:");
    console.log(`{
  "Title": "My Page",
  "Description": "Some text",
  "Priority": "High",
  "Done": true,
  "Due Date": "2024-01-15"
}`);
  }
}

// Run the script
main().catch(console.error);