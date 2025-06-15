#!/usr/bin/env bun

/**
 * Enhanced Notion Content Generator
 * Creates pages with rich content blocks
 * Run with: bun run notionContentGenerator.ts
 */

// Configuration
const API_BASE = "http://localhost:3000/api/pipedream/proxy";
const USER_ID = "test-user-123";
const NOTION_VERSION = "2022-06-28";

let NOTION_ACCOUNT_ID = "";

// Content generators
const contentGenerators = {
  // Paragraph templates
  paragraphs: {
    intro: [
      "In this {document}, we'll explore the fundamental concepts of {topic} and how they apply to modern software development.",
      "Welcome to this comprehensive guide on {topic}. Whether you're a beginner or an experienced developer, you'll find valuable insights here.",
      "{topic} has become increasingly important in today's tech landscape. Let's dive into what makes it so crucial.",
      "This {document} aims to provide a clear understanding of {topic}, breaking down complex concepts into digestible pieces.",
      "If you've been curious about {topic}, you've come to the right place. We'll cover everything from basics to advanced techniques."
    ],
    body: [
      "One of the key aspects of {topic} is its ability to {benefit}. This makes it particularly useful for {useCase}.",
      "When working with {topic}, it's important to understand {concept}. This forms the foundation for more advanced implementations.",
      "Many developers struggle with {challenge} when first learning {topic}. The key is to {solution}.",
      "The real power of {topic} becomes apparent when you {action}. This opens up possibilities for {outcome}.",
      "In practice, {topic} can be applied to {application}. This has proven to be effective in {scenario}."
    ],
    conclusion: [
      "As we've seen, {topic} offers powerful capabilities for modern development. The key is to start small and gradually expand your understanding.",
      "In conclusion, mastering {topic} requires practice and patience, but the benefits are well worth the effort.",
      "We've covered the essential aspects of {topic}. Now it's time to put this knowledge into practice.",
      "Remember, {topic} is a journey, not a destination. Keep experimenting and learning.",
      "With these foundations in place, you're ready to explore {topic} further and build amazing things."
    ]
  },

  // Benefits and use cases
  benefits: [
    "improve performance", "enhance user experience", "simplify complex workflows",
    "reduce technical debt", "increase scalability", "enable better collaboration",
    "streamline development", "ensure consistency", "optimize resources"
  ],

  useCases: [
    "large-scale applications", "startup projects", "enterprise systems",
    "mobile development", "web applications", "data processing pipelines",
    "real-time systems", "distributed architectures", "cloud deployments"
  ],

  concepts: [
    "the underlying architecture", "core principles", "design patterns",
    "best practices", "common pitfalls", "performance considerations",
    "security implications", "testing strategies", "deployment options"
  ],

  challenges: [
    "initial setup", "understanding the syntax", "debugging issues",
    "performance optimization", "integration with existing systems",
    "team adoption", "maintaining consistency", "scaling challenges"
  ],

  solutions: [
    "start with simple examples", "use proper tooling", "follow established patterns",
    "invest in learning", "leverage community resources", "practice regularly",
    "seek mentorship", "build incrementally", "focus on fundamentals"
  ],

  // Code examples by topic
  codeExamples: {
    javascript: [
      `// Example: Async/await pattern
async function fetchData() {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}`,
      `// Example: Array methods
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
const evens = numbers.filter(n => n % 2 === 0);
const sum = numbers.reduce((acc, n) => acc + n, 0);`,
      `// Example: Object destructuring
const user = { name: 'Alice', age: 30, city: 'NYC' };
const { name, age } = user;
console.log(\`\${name} is \${age} years old\`);`
    ],
    python: [
      `# Example: List comprehension
numbers = [1, 2, 3, 4, 5]
squares = [n**2 for n in numbers]
evens = [n for n in numbers if n % 2 == 0]`,
      `# Example: Context manager
with open('file.txt', 'r') as f:
    content = f.read()
    print(f"File has {len(content)} characters")`,
      `# Example: Decorator pattern
def timer(func):
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        print(f"{func.__name__} took {time.time() - start}s")
        return result
    return wrapper`
    ],
    general: [
      `// Example implementation
function processData(input) {
  // Validate input
  if (!input) return null;
  
  // Transform data
  const result = transform(input);
  
  // Return processed result
  return result;
}`,
      `// Configuration example
const config = {
  apiUrl: process.env.API_URL,
  timeout: 5000,
  retries: 3,
  debug: true
};`,
      `// Error handling pattern
try {
  const result = performOperation();
  handleSuccess(result);
} catch (error) {
  logError(error);
  handleFailure(error);
}`
    ]
  },

  // Lists and bullet points
  bulletPoints: {
    features: [
      "Easy to integrate with existing systems",
      "Comprehensive documentation and examples",
      "Active community support",
      "Regular updates and improvements",
      "Extensive plugin ecosystem"
    ],
    benefits: [
      "Increased productivity",
      "Better code organization",
      "Improved team collaboration",
      "Reduced development time",
      "Enhanced maintainability"
    ],
    steps: [
      "Install the required dependencies",
      "Configure your environment",
      "Create your first project",
      "Run the development server",
      "Deploy to production"
    ]
  },

  // Headings
  headings: {
    h2: [
      "Getting Started", "Core Concepts", "Advanced Techniques",
      "Best Practices", "Common Patterns", "Troubleshooting",
      "Performance Tips", "Security Considerations", "Deployment Guide"
    ],
    h3: [
      "Prerequisites", "Installation", "Configuration",
      "Basic Usage", "Advanced Features", "Tips and Tricks",
      "Common Issues", "Next Steps", "Additional Resources"
    ]
  },

  // Quotes and callouts
  quotes: [
    "The best way to learn is by doing. Start small and iterate.",
    "Simplicity is the ultimate sophistication in software design.",
    "Code is read more often than it's written. Optimize for readability.",
    "Premature optimization is the root of all evil, but performance matters.",
    "Good architecture makes the system easy to understand, develop, and maintain."
  ],

  // Table data
  tableData: {
    comparison: [
      ["Feature", "Option A", "Option B", "Option C"],
      ["Performance", "High", "Medium", "Low"],
      ["Complexity", "Low", "Medium", "High"],
      ["Cost", "$", "$$", "$$$"],
      ["Support", "Community", "Professional", "Enterprise"]
    ],
    metrics: [
      ["Metric", "Before", "After", "Improvement"],
      ["Load Time", "3.2s", "1.1s", "65%"],
      ["Memory Usage", "512MB", "256MB", "50%"],
      ["API Calls", "100/min", "250/min", "150%"],
      ["Error Rate", "2.5%", "0.3%", "88%"]
    ]
  }
};

// Block generators
function generateParagraphBlock(type: "intro" | "body" | "conclusion" = "body"): any {
  const templates = contentGenerators.paragraphs[type];
  const template = randomFrom(templates);
  
  const text = template
    .replace(/{topic}/g, randomFrom(generators.topics))
    .replace("{document}", randomFrom(["article", "guide", "tutorial", "post"]))
    .replace("{benefit}", randomFrom(contentGenerators.benefits))
    .replace("{useCase}", randomFrom(contentGenerators.useCases))
    .replace("{concept}", randomFrom(contentGenerators.concepts))
    .replace("{challenge}", randomFrom(contentGenerators.challenges))
    .replace("{solution}", randomFrom(contentGenerators.solutions))
    .replace("{action}", randomFrom(["implement it correctly", "understand the patterns", "apply best practices"]))
    .replace("{outcome}", randomFrom(["better performance", "cleaner code", "improved scalability"]))
    .replace("{application}", randomFrom(["real-world projects", "production systems", "modern applications"]))
    .replace("{scenario}", randomFrom(["high-traffic environments", "resource-constrained systems", "complex architectures"]));

  return {
    object: "block",
    type: "paragraph",
    paragraph: {
      rich_text: [{
        type: "text",
        text: { content: text }
      }]
    }
  };
}

function generateHeadingBlock(level: 1 | 2 | 3 = 2): any {
  const headingType = `heading_${level}`;
  const headings = level === 2 ? contentGenerators.headings.h2 : contentGenerators.headings.h3;
  
  return {
    object: "block",
    type: headingType,
    [headingType]: {
      rich_text: [{
        type: "text",
        text: { content: randomFrom(headings) }
      }]
    }
  };
}

function generateCodeBlock(): any {
  const language = randomFrom(["javascript", "python", "general"]);
  const examples = contentGenerators.codeExamples[language as keyof typeof contentGenerators.codeExamples];
  
  return {
    object: "block",
    type: "code",
    code: {
      rich_text: [{
        type: "text",
        text: { content: randomFrom(examples) }
      }],
      language: language === "general" ? "javascript" : language
    }
  };
}

function generateBulletListBlock(): any {
  const listType = randomFrom(["features", "benefits", "steps"]);
  const items = contentGenerators.bulletPoints[listType as keyof typeof contentGenerators.bulletPoints];
  
  return {
    object: "block",
    type: "bulleted_list_item",
    bulleted_list_item: {
      rich_text: [{
        type: "text",
        text: { content: randomFrom(items) }
      }]
    }
  };
}

function generateNumberedListBlock(number: number): any {
  const steps = [
    "First, understand the problem you're trying to solve",
    "Research available solutions and approaches",
    "Choose the most appropriate tool or technique",
    "Implement a proof of concept",
    "Test thoroughly in different scenarios",
    "Refine based on feedback and results",
    "Document your solution for future reference"
  ];
  
  return {
    object: "block",
    type: "numbered_list_item",
    numbered_list_item: {
      rich_text: [{
        type: "text",
        text: { content: steps[Math.min(number - 1, steps.length - 1)] }
      }]
    }
  };
}

function generateQuoteBlock(): any {
  return {
    object: "block",
    type: "quote",
    quote: {
      rich_text: [{
        type: "text",
        text: { content: randomFrom(contentGenerators.quotes) }
      }]
    }
  };
}

function generateCalloutBlock(): any {
  const calloutTypes = [
    { emoji: "💡", text: "Pro tip: Always validate user input before processing." },
    { emoji: "⚠️", text: "Warning: This operation may impact performance at scale." },
    { emoji: "📝", text: "Note: Remember to update your documentation after changes." },
    { emoji: "🚀", text: "Quick start: Clone the repository and run npm install." },
    { emoji: "🔍", text: "Debug tip: Check the console for detailed error messages." }
  ];
  
  const callout = randomFrom(calloutTypes);
  
  return {
    object: "block",
    type: "callout",
    callout: {
      rich_text: [{
        type: "text",
        text: { content: callout.text }
      }],
      icon: { type: "emoji", emoji: callout.emoji }
    }
  };
}

function generateDividerBlock(): any {
  return {
    object: "block",
    type: "divider",
    divider: {}
  };
}

function generateTableBlock(): any {
  const tableType = randomFrom(["comparison", "metrics"]);
  const data = contentGenerators.tableData[tableType as keyof typeof contentGenerators.tableData];
  
  return {
    object: "block",
    type: "table",
    table: {
      table_width: data[0].length,
      has_column_header: true,
      has_row_header: false,
      children: data.map(row => ({
        object: "block",
        type: "table_row",
        table_row: {
          cells: row.map(cell => [{
            type: "text",
            text: { content: cell }
          }])
        }
      }))
    }
  };
}

function generateToggleBlock(): any {
  const toggles = [
    { title: "Implementation Details", content: "Here you'll find the step-by-step implementation guide..." },
    { title: "Frequently Asked Questions", content: "Q: How do I get started?\nA: Follow the installation guide above..." },
    { title: "Advanced Configuration", content: "For advanced users, additional configuration options are available..." },
    { title: "Troubleshooting Guide", content: "If you encounter issues, check these common solutions..." }
  ];
  
  const toggle = randomFrom(toggles);
  
  return {
    object: "block",
    type: "toggle",
    toggle: {
      rich_text: [{
        type: "text",
        text: { content: toggle.title }
      }],
      children: [] // Children must be empty on creation
    }
  };
}

// Generate a full content structure
function generateContentBlocks(style: "article" | "tutorial" | "documentation" = "article"): any[] {
  const blocks: any[] = [];
  
  if (style === "article") {
    // Article structure
    blocks.push(generateParagraphBlock("intro"));
    blocks.push(generateHeadingBlock(2));
    blocks.push(generateParagraphBlock());
    blocks.push(generateParagraphBlock());
    blocks.push(generateQuoteBlock());
    blocks.push(generateHeadingBlock(2));
    blocks.push(generateParagraphBlock());
    blocks.push(generateCodeBlock());
    blocks.push(generateParagraphBlock());
    blocks.push(generateCalloutBlock());
    blocks.push(generateHeadingBlock(2));
    blocks.push(generateParagraphBlock());
    blocks.push(generateBulletListBlock());
    blocks.push(generateBulletListBlock());
    blocks.push(generateBulletListBlock());
    blocks.push(generateParagraphBlock("conclusion"));
  } else if (style === "tutorial") {
    // Tutorial structure
    blocks.push(generateParagraphBlock("intro"));
    blocks.push(generateHeadingBlock(2));
    blocks.push(generateCalloutBlock());
    blocks.push(generateHeadingBlock(3));
    blocks.push(generateNumberedListBlock(1));
    blocks.push(generateNumberedListBlock(2));
    blocks.push(generateNumberedListBlock(3));
    blocks.push(generateHeadingBlock(3));
    blocks.push(generateParagraphBlock());
    blocks.push(generateCodeBlock());
    blocks.push(generateParagraphBlock());
    blocks.push(generateDividerBlock());
    blocks.push(generateHeadingBlock(2));
    blocks.push(generateTableBlock());
    blocks.push(generateParagraphBlock());
    blocks.push(generateToggleBlock());
    blocks.push(generateParagraphBlock("conclusion"));
  } else {
    // Documentation structure
    blocks.push(generateHeadingBlock(1));
    blocks.push(generateParagraphBlock("intro"));
    blocks.push(generateTableBlock());
    blocks.push(generateHeadingBlock(2));
    blocks.push(generateParagraphBlock());
    blocks.push(generateBulletListBlock());
    blocks.push(generateBulletListBlock());
    blocks.push(generateHeadingBlock(2));
    blocks.push(generateCodeBlock());
    blocks.push(generateCalloutBlock());
    blocks.push(generateHeadingBlock(2));
    blocks.push(generateToggleBlock());
    blocks.push(generateDividerBlock());
    blocks.push(generateParagraphBlock("conclusion"));
  }
  
  return blocks;
}

// Import generators from previous script
const generators = {
  topics: [
    "Machine Learning", "Web Development", "Data Science", "Cloud Computing",
    "Artificial Intelligence", "Blockchain", "Cybersecurity", "DevOps",
    "Mobile Development", "Database Design", "API Architecture", "Microservices"
  ]
};

// Utility functions
function randomFrom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// API functions (reuse from previous scripts)
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

async function createPageWithContent(databaseId: string, title: string, contentStyle: "article" | "tutorial" | "documentation" = "article"): Promise<any> {
  console.log(`\n📝 Creating page: "${title}" with ${contentStyle} content...`);
  
  // Get database schema to create proper properties
  const schema = await getDatabaseSchema(databaseId);
  const properties: any = {};
  
  // Find the title property and set it
  for (const [name, prop] of Object.entries(schema.properties)) {
    if ((prop as any).type === "title") {
      properties[name] = {
        title: [{
          type: "text",
          text: { content: title }
        }]
      };
    }
    // Add other properties with default/generated values if needed
    else if ((prop as any).type === "select" && name.toLowerCase().includes("genre")) {
      properties[name] = {
        select: { name: contentStyle === "article" ? "Blog Post" : contentStyle === "tutorial" ? "Tutorial" : "Documentation" }
      };
    }
    else if ((prop as any).type === "date" && name.toLowerCase().includes("date")) {
      properties[name] = {
        date: { start: new Date().toISOString().split('T')[0] }
      };
    }
  }
  
  // Create the page in the database
  const page = await makeNotionRequest("POST", "/pages", {
    parent: { 
      type: "database_id",
      database_id: databaseId 
    },
    properties: properties
  });

  console.log(`✅ Page created: ${page.id}`);
  
  // Generate content blocks
  const blocks = generateContentBlocks(contentStyle);
  
  // Add blocks to the page
  console.log(`📚 Adding ${blocks.length} content blocks...`);
  
  const response = await makeNotionRequest("PATCH", `/blocks/${page.id}/children`, {
    children: blocks
  });
  
  console.log(`✅ Content added successfully!`);
  console.log(`🔗 View page: ${page.url}\n`);
  
  return page;
}

// Main execution
async function main() {
  console.log("🚀 Notion Content Generator");
  console.log("===========================\n");

  const hasAccount = await getAccounts();
  if (!hasAccount) {
    console.log("\n❌ Please connect a Notion account at http://localhost:3000/me");
    return;
  }

  const args = process.argv.slice(2);
  
  // Direct mode with database ID
  if (args.length >= 2 && args[0].length > 30) {
    const databaseId = args[0];
    const count = parseInt(args[1]) || 1;
    const style = (args[2] as "article" | "tutorial" | "documentation") || "article";
    
    console.log(`\n🎯 Creating ${count} ${style}(s) with rich content...\n`);

    for (let i = 0; i < count; i++) {
      const titleTemplates = {
        article: [
          "The Complete Guide to {topic}",
          "Understanding {topic}: A Deep Dive",
          "Why {topic} Matters in 2024"
        ],
        tutorial: [
          "How to Build a {topic} Application",
          "Getting Started with {topic}: Step by Step",
          "{topic} Tutorial for Beginners"
        ],
        documentation: [
          "{topic} API Reference",
          "{topic} Developer Documentation",
          "{topic} Technical Specification"
        ]
      };
      
      const template = randomFrom(titleTemplates[style]);
      const title = template.replace("{topic}", randomFrom(generators.topics));
      
      try {
        await createPageWithContent(databaseId, title, style);
      } catch (error) {
        console.error(`❌ Failed to create page ${i + 1}:`, error);
      }
      
      // Rate limiting
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log("\n✨ All pages created successfully!");
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
    console.log("  bun run notionContentGenerator.ts <database-id> <count> [style]");
    console.log("\nStyles: article (default), tutorial, documentation");
    console.log("\nExamples:");
    console.log(`  bun run notionContentGenerator.ts ${databases[0].id} 1`);
    console.log(`  bun run notionContentGenerator.ts ${databases[0].id} 5 tutorial`);
    console.log(`  bun run notionContentGenerator.ts ${databases[0].id} 3 documentation`);
  }
}

main().catch(console.error);