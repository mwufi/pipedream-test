#!/usr/bin/env bun

/**
 * Smart Notion Data Generator
 * Analyzes database schema and generates appropriate fake data
 * Run with: bun run notionDataGenerator.ts
 */

// Configuration
const API_BASE = "http://localhost:3000/api/pipedream/proxy";
const USER_ID = "test-user-123";
const NOTION_VERSION = "2022-06-28";

let NOTION_ACCOUNT_ID = "";

// Data generators
const generators = {
  // Title generators
  titles: {
    default: [
      "The Art of {topic}",
      "Understanding {topic}",
      "A Guide to {topic}",
      "Exploring {topic}",
      "The Future of {topic}",
      "{topic}: A Deep Dive",
      "Mastering {topic}",
      "Why {topic} Matters",
      "Getting Started with {topic}",
      "{topic} Best Practices"
    ],
    writing: [
      "Reflections on {topic}",
      "A Letter to {topic}",
      "The {adjective} Story of {topic}",
      "Notes on {topic}",
      "Thoughts About {topic}",
      "{topic}: An Essay",
      "Meditations on {topic}",
      "The {adjective} Truth About {topic}"
    ],
    task: [
      "Complete {action} for {topic}",
      "Review {topic} {document}",
      "Update {topic} documentation",
      "Fix {topic} issue",
      "Implement {topic} feature",
      "Research {topic} options",
      "Schedule {topic} meeting",
      "Prepare {topic} presentation"
    ],
    project: [
      "{topic} Redesign",
      "{topic} 2.0",
      "Project {topic}",
      "{topic} Initiative",
      "{topic} Improvement Plan",
      "New {topic} System",
      "{topic} Migration",
      "{topic} Optimization"
    ]
  },

  // Topics for titles
  topics: [
    "Machine Learning", "Web Development", "Data Science", "Cloud Computing",
    "Artificial Intelligence", "Blockchain", "Cybersecurity", "DevOps",
    "Mobile Development", "Database Design", "API Architecture", "Microservices",
    "User Experience", "System Design", "Code Quality", "Performance",
    "Testing Strategies", "Continuous Integration", "Remote Work", "Team Building"
  ],

  adjectives: [
    "Amazing", "Incredible", "Essential", "Ultimate", "Complete", "Hidden",
    "Surprising", "Untold", "Real", "Definitive", "Modern", "Classic"
  ],

  actions: [
    "implementation", "review", "analysis", "documentation", "testing",
    "deployment", "optimization", "refactoring", "migration", "integration"
  ],

  documents: [
    "proposal", "report", "specification", "documentation", "presentation",
    "analysis", "summary", "guidelines", "requirements", "architecture"
  ],

  // Genre/Category generators
  genres: {
    writing: [
      "Technical Essay", "Blog Post", "Tutorial", "Opinion Piece",
      "Case Study", "Research Paper", "Documentation", "Review",
      "Personal Story", "Analysis", "Guide", "Whitepaper"
    ],
    general: [
      "Technology", "Business", "Design", "Marketing", "Sales",
      "Engineering", "Product", "Strategy", "Operations", "Finance"
    ]
  },

  // Status generators
  statuses: {
    task: ["Todo", "In Progress", "Done", "Blocked", "On Hold"],
    project: ["Planning", "Active", "Review", "Completed", "Archived"],
    general: ["Draft", "Review", "Published", "Archived"]
  },

  // Priority generators
  priorities: ["Low", "Medium", "High", "Critical", "Urgent"],

  // Tag generators
  tags: {
    technical: [
      "frontend", "backend", "database", "api", "security", "performance",
      "testing", "documentation", "refactoring", "bug-fix", "feature"
    ],
    business: [
      "strategy", "planning", "review", "meeting", "presentation",
      "report", "analysis", "research", "proposal", "budget"
    ],
    general: [
      "important", "urgent", "review-needed", "draft", "final",
      "archived", "reference", "template", "example", "resource"
    ]
  },

  // Description generators
  descriptions: [
    "This {item} covers the essential aspects of {topic}, providing detailed insights and practical examples.",
    "A comprehensive look at {topic}, including best practices and common pitfalls to avoid.",
    "An in-depth analysis of {topic} with real-world applications and case studies.",
    "Everything you need to know about {topic}, from basics to advanced concepts.",
    "A practical guide to implementing {topic} in modern development environments.",
    "Key insights and lessons learned from working with {topic} in production.",
    "Exploring the latest trends and developments in {topic}.",
    "A collection of thoughts and observations about {topic} based on recent experience."
  ],

  // People names
  people: [
    "Alice Johnson", "Bob Smith", "Carol Williams", "David Brown",
    "Emma Davis", "Frank Miller", "Grace Wilson", "Henry Moore",
    "Iris Taylor", "Jack Anderson", "Karen Thomas", "Liam Jackson"
  ],

  // Email generators
  emails: [
    "john.doe@example.com", "jane.smith@company.com", "info@business.org",
    "contact@startup.io", "admin@techcorp.com", "support@service.net"
  ],

  // URL generators
  urls: [
    "https://example.com/docs", "https://github.com/user/repo",
    "https://medium.com/@author/article", "https://dev.to/post",
    "https://stackoverflow.com/questions/123", "https://docs.api.com/reference"
  ]
};

// Utility functions
function randomFrom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysBack: number = 30, daysFuture: number = 30): Date {
  const now = new Date();
  const start = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  const end = new Date(now.getTime() + daysFuture * 24 * 60 * 60 * 1000);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateTitle(context: string = "default"): string {
  const templates = generators.titles[context as keyof typeof generators.titles] || generators.titles.default;
  const template = randomFrom(templates);
  
  return template
    .replace("{topic}", randomFrom(generators.topics))
    .replace("{adjective}", randomFrom(generators.adjectives))
    .replace("{action}", randomFrom(generators.actions))
    .replace("{document}", randomFrom(generators.documents));
}

function generateDescription(): string {
  const template = randomFrom(generators.descriptions);
  return template
    .replace("{item}", randomFrom(["document", "article", "guide", "resource"]))
    .replace("{topic}", randomFrom(generators.topics));
}

function inferPropertyGenerator(name: string, type: string, schema: any): any {
  const lowerName = name.toLowerCase();

  // Title property
  if (type === "title") {
    // Infer context from property name
    if (lowerName.includes("task")) return { title: [{ type: "text", text: { content: generateTitle("task") } }] };
    if (lowerName.includes("project")) return { title: [{ type: "text", text: { content: generateTitle("project") } }] };
    if (lowerName.includes("writing")) return { title: [{ type: "text", text: { content: generateTitle("writing") } }] };
    return { title: [{ type: "text", text: { content: generateTitle() } }] };
  }

  // Rich text property
  if (type === "rich_text") {
    if (lowerName.includes("description") || lowerName.includes("desc") || lowerName.includes("detail")) {
      return { rich_text: [{ type: "text", text: { content: generateDescription() } }] };
    }
    if (lowerName.includes("note") || lowerName.includes("comment")) {
      return { rich_text: [{ type: "text", text: { content: `Note: ${randomFrom(["Important", "Remember", "TODO", "Review"])} - ${randomFrom(generators.topics).toLowerCase()} needs attention` } }] };
    }
    return { rich_text: [{ type: "text", text: { content: randomFrom(["Sample text content", "Lorem ipsum dolor sit amet", "This is a test entry", "Content goes here"]) } }] };
  }

  // Select property
  if (type === "select") {
    // Use existing options if available
    if (schema.select?.options?.length > 0) {
      return { select: { name: randomFrom(schema.select.options).name } };
    }
    
    // Infer from property name
    if (lowerName.includes("status")) return { select: { name: randomFrom(generators.statuses.general) } };
    if (lowerName.includes("priority")) return { select: { name: randomFrom(generators.priorities) } };
    if (lowerName.includes("genre") || lowerName.includes("category")) {
      return { select: { name: randomFrom(generators.genres.writing) } };
    }
    if (lowerName.includes("type")) return { select: { name: randomFrom(["Type A", "Type B", "Type C"]) } };
    
    return { select: { name: `Option ${randomInt(1, 5)}` } };
  }

  // Multi-select property
  if (type === "multi_select") {
    const numTags = randomInt(1, 3);
    let tags: string[] = [];
    
    if (schema.multi_select?.options?.length > 0) {
      // Use existing options
      const shuffled = [...schema.multi_select.options].sort(() => Math.random() - 0.5);
      tags = shuffled.slice(0, numTags).map(opt => opt.name);
    } else {
      // Generate based on name
      if (lowerName.includes("tag")) tags = Array.from({ length: numTags }, () => randomFrom(generators.tags.general));
      else if (lowerName.includes("tech")) tags = Array.from({ length: numTags }, () => randomFrom(generators.tags.technical));
      else if (lowerName.includes("skill")) tags = Array.from({ length: numTags }, () => randomFrom(["JavaScript", "Python", "React", "Node.js", "SQL", "Docker"]));
      else tags = Array.from({ length: numTags }, (_, i) => `Tag ${i + 1}`);
    }
    
    return { multi_select: tags.map(name => ({ name })) };
  }

  // Date property
  if (type === "date") {
    if (lowerName.includes("due") || lowerName.includes("deadline")) {
      // Future dates for deadlines
      return { date: { start: randomDate(0, 30).toISOString().split('T')[0] } };
    }
    if (lowerName.includes("created") || lowerName.includes("published")) {
      // Past dates for creation
      return { date: { start: randomDate(60, 0).toISOString().split('T')[0] } };
    }
    // Mixed past and future
    return { date: { start: randomDate().toISOString().split('T')[0] } };
  }

  // Number property
  if (type === "number") {
    if (lowerName.includes("price") || lowerName.includes("cost")) return { number: randomInt(10, 1000) };
    if (lowerName.includes("score") || lowerName.includes("rating")) return { number: randomInt(1, 10) };
    if (lowerName.includes("count") || lowerName.includes("quantity")) return { number: randomInt(1, 100) };
    if (lowerName.includes("progress") || lowerName.includes("percent")) return { number: randomInt(0, 100) };
    return { number: randomInt(1, 100) };
  }

  // Checkbox property
  if (type === "checkbox") {
    if (lowerName.includes("done") || lowerName.includes("complete")) return { checkbox: Math.random() > 0.3 }; // 70% chance of true
    if (lowerName.includes("active") || lowerName.includes("enabled")) return { checkbox: Math.random() > 0.2 }; // 80% chance of true
    return { checkbox: Math.random() > 0.5 };
  }

  // URL property
  if (type === "url") {
    return { url: randomFrom(generators.urls) };
  }

  // Email property
  if (type === "email") {
    return { email: randomFrom(generators.emails) };
  }

  // Phone property
  if (type === "phone_number") {
    return { phone_number: `+1${randomInt(200, 999)}${randomInt(200, 999)}${randomInt(1000, 9999)}` };
  }

  // People property
  if (type === "people") {
    // Would need actual user IDs
    return undefined;
  }

  return undefined;
}

// Notion API functions
async function makeNotionRequest(method: string, endpoint: string, body?: any): Promise<any> {
  try {
    const response = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        account_id: NOTION_ACCOUNT_ID,
        external_user_id: USER_ID,
        target_url: `https://api.notion.com/v1${endpoint}`,
        method: method,
        headers: { "Notion-Version": NOTION_VERSION },
        body: body,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Request failed");
    return data.data;
  } catch (error) {
    console.error(`❌ Error making request to ${endpoint}:`, error);
    throw error;
  }
}

async function getAccounts(): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:3000/api/pipedream/accounts?external_user_id=${USER_ID}`);
    const data = await response.json();
    const accounts = Array.isArray(data) ? data : data.data || [];
    const notionAccount = accounts.find((acc: any) => acc.app.name_slug === "notion");
    
    if (notionAccount) {
      NOTION_ACCOUNT_ID = notionAccount.id;
      console.log(`✅ Found Notion account: ${notionAccount.name}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error("❌ Error fetching accounts:", error);
    return false;
  }
}

async function findDatabases(): Promise<any[]> {
  const response = await makeNotionRequest("POST", "/search", {
    filter: { property: "object", value: "database" },
    page_size: 100,
  });
  return response.results || [];
}

async function getDatabaseSchema(databaseId: string): Promise<any> {
  return await makeNotionRequest("GET", `/databases/${databaseId}`);
}

async function createDatabasePage(databaseId: string, properties: any): Promise<any> {
  return await makeNotionRequest("POST", "/pages", {
    parent: { type: "database_id", database_id: databaseId },
    properties: properties,
  });
}

async function generateDataForDatabase(databaseId: string, count: number = 10) {
  console.log("\n📊 Analyzing database schema...");
  
  const schema = await getDatabaseSchema(databaseId);
  const dbTitle = schema.title?.[0]?.plain_text || "Untitled Database";
  
  console.log(`Database: ${dbTitle}`);
  console.log("\nProperties detected:");
  
  const propertyGenerators: Array<[string, any]> = [];
  
  Object.entries(schema.properties).forEach(([name, prop]: [string, any]) => {
    // Skip computed properties
    if (["created_time", "created_by", "last_edited_time", "last_edited_by"].includes(prop.type)) {
      return;
    }
    
    console.log(`  - ${name} (${prop.type})`);
    propertyGenerators.push([name, prop]);
  });

  console.log(`\n🎲 Generating ${count} entries with smart data...\n`);

  for (let i = 0; i < count; i++) {
    const properties: any = {};
    
    // Generate data for each property
    for (const [name, schema] of propertyGenerators) {
      const value = inferPropertyGenerator(name, schema.type, schema);
      if (value !== undefined) {
        properties[name] = value;
      }
    }

    try {
      const page = await createDatabasePage(databaseId, properties);
      console.log(`✅ Created ${i + 1}/${count}: ${page.url}`);
    } catch (error) {
      console.error(`❌ Failed to create entry ${i + 1}:`, error);
    }

    // Rate limiting
    if (i < count - 1) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  console.log("\n✨ Generation complete!");
}

// Main execution
async function main() {
  console.log("🚀 Smart Notion Data Generator");
  console.log("==============================\n");

  const hasAccount = await getAccounts();
  if (!hasAccount) {
    console.log("\n❌ Please connect a Notion account at http://localhost:3000/me");
    return;
  }

  const args = process.argv.slice(2);
  
  if (args.length === 2 && args[0] && args[1]) {
    // Direct mode: bun run notionDataGenerator.ts <database-id> <count>
    await generateDataForDatabase(args[0], parseInt(args[1]) || 10);
  } else {
    // Interactive mode
    console.log("\n🔍 Finding databases...\n");
    const databases = await findDatabases();
    
    if (databases.length === 0) {
      console.log("❌ No databases found");
      return;
    }

    console.log("Found databases:");
    databases.forEach((db: any, index: number) => {
      const title = db.title?.[0]?.plain_text || "Untitled";
      console.log(`  ${index + 1}. ${title} (${db.id})`);
    });

    console.log("\nUsage:");
    console.log("  bun run notionDataGenerator.ts                    # This menu");
    console.log("  bun run notionDataGenerator.ts <db-id> <count>   # Generate data");
    console.log("\nExample:");
    console.log(`  bun run notionDataGenerator.ts ${databases[0].id} 20`);
  }
}

main().catch(console.error);