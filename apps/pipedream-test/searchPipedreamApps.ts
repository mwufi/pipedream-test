#!/usr/bin/env bun

/**
 * Pipedream App Search CLI
 * Search for available apps and their components
 * Run with: bun run searchPipedreamApps.ts <query>
 */

import pd from "./lib/server/pipedream_client";

async function searchApps(query: string) {
  console.log(`🔍 Searching for apps matching "${query}"...\n`);
  
  try {
    const response = await pd.getApps({ q: query });
    
    if (!response.data || response.data.length === 0) {
      console.log("No apps found.");
      return;
    }
    
    console.log(`Found ${response.page_info.total_count} apps:\n`);
    
    for (const app of response.data) {
      console.log(`📦 ${app.name} (${app.name_slug})`);
      console.log(`   ID: ${app.id}`);
      console.log(`   Auth: ${app.auth_type}`);
      if (app.description) {
        console.log(`   Description: ${app.description}`);
      }
      if (app.categories?.length) {
        console.log(`   Categories: ${app.categories.join(", ")}`);
      }
      if (app.connect?.proxy_enabled) {
        console.log(`   ✅ Proxy enabled`);
        if (app.connect.allowed_domains?.length) {
          console.log(`   Allowed domains: ${app.connect.allowed_domains.join(", ")}`);
        }
      }
      console.log();
    }
    
    // Show how to get components
    if (response.data.length > 0) {
      console.log("💡 To see components for an app, run:");
      console.log(`   bun run searchPipedreamApps.ts --components ${response.data[0].name_slug}\n`);
    }
  } catch (error) {
    console.error("Error searching apps:", error);
  }
}

async function getAppComponents(appSlug: string) {
  console.log(`🔍 Getting components for "${appSlug}"...\n`);
  
  try {
    const response = await pd.getComponents({ app: appSlug });
    
    if (!response.data || response.data.length === 0) {
      console.log("No components found.");
      return;
    }
    
    console.log(`Found ${response.page_info.total_count} components:\n`);
    
    // Group by type if available
    const actions = response.data.filter((c: any) => !c.key.includes("webhook"));
    const triggers = response.data.filter((c: any) => c.key.includes("webhook"));
    
    if (actions.length > 0) {
      console.log("🎯 Actions:");
      for (const component of actions) {
        console.log(`   • ${component.name}`);
        console.log(`     Key: ${component.key}`);
        console.log(`     Version: ${component.version}`);
        if (component.description) {
          console.log(`     Description: ${component.description}`);
        }
        console.log();
      }
    }
    
    if (triggers.length > 0) {
      console.log("⚡ Triggers:");
      for (const component of triggers) {
        console.log(`   • ${component.name}`);
        console.log(`     Key: ${component.key}`);
        console.log(`     Version: ${component.version}`);
        if (component.description) {
          console.log(`     Description: ${component.description}`);
        }
        console.log();
      }
    }
  } catch (error) {
    console.error("Error getting components:", error);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log("Pipedream App Search");
    console.log("===================\n");
    console.log("Usage:");
    console.log("  bun run searchPipedreamApps.ts <query>              # Search for apps");
    console.log("  bun run searchPipedreamApps.ts --components <app>   # Get components for an app");
    console.log("\nExamples:");
    console.log("  bun run searchPipedreamApps.ts salesforce");
    console.log("  bun run searchPipedreamApps.ts google");
    console.log("  bun run searchPipedreamApps.ts --components slack");
    console.log("  bun run searchPipedreamApps.ts --components github");
    return;
  }
  
  if (args[0] === "--components" && args[1]) {
    await getAppComponents(args[1]);
  } else {
    await searchApps(args.join(" "));
  }
}

main().catch(console.error);