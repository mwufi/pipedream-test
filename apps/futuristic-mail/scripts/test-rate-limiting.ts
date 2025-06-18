import * as restate from "@restatedev/restate-sdk-clients";
import { Limiter } from "@/app/restate/v1/[[...services]]/ratelimit/limiter";
import helloService from "@/app/restate/v1/[[...services]]/helloService";

const restateUrl = process.env.RESTATE_URL || "http://localhost:8080";
const client = restate.connect({ url: restateUrl });

// Configuration
const RATE_LIMIT = 60; // 60 requests per minute for testing
const BURST_SIZE = 5; // Allow burst of 5
const TEST_DURATION_MS = 20000; // 20 seconds test

async function setupRateLimiter() {
  console.log("Setting up rate limiter for testing...");
  const limiter = client.objectClient<Limiter>({ name: "limiter" }, "mail-processing");
  
  // Set test rate limits (convert per minute to per second)
  const ratePerSecond = RATE_LIMIT / 60; // 5 per minute = 0.0833 per second
  await limiter.setRate({ newLimit: ratePerSecond, newBurst: BURST_SIZE });
  
  // Verify the configuration
  const state = await limiter.state();
  console.log(`Rate limiter configured:`);
  console.log(`  Limit: ${state.limit} tokens/second (${state.limit * 60} tokens/minute)`);
  console.log(`  Burst: ${state.burst}`);
  console.log(`  Current tokens: ${state.tokens}`);
  
  if (state.limit > 1) {
    console.warn(`⚠️  WARNING: Rate limit seems too high! Expected ~${ratePerSecond} but got ${state.limit}`);
  }
}

async function callProcessMail(mailId: string): Promise<{success: boolean, duration: number, result?: string, error?: string}> {
  const start = Date.now();
  try {
    const result = await client.serviceClient(helloService).processMail(mailId);
    const duration = Date.now() - start;
    return { success: true, duration, result };
  } catch (error) {
    const duration = Date.now() - start;
    return { success: false, duration, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function testConcurrentRequests() {
  console.log("\n=== Testing Concurrent Requests ===");
  console.log("Sending 10 concurrent requests...\n");
  
  const promises = Array.from({ length: 10 }, (_, i) => 
    callProcessMail(`mail-${i + 1}`)
  );
  
  const startTime = Date.now();
  const results = await Promise.all(promises);
  const totalDuration = Date.now() - startTime;
  
  // Analyze results
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log("Results:");
  results.forEach((result, index) => {
    const status = result.success ? "✓" : "✗";
    console.log(`  ${status} Request ${index + 1}: ${result.duration}ms ${result.error ? `(${result.error})` : ''}`);
  });
  
  console.log(`\nSummary:`);
  console.log(`  Total duration: ${totalDuration}ms`);
  console.log(`  Successful: ${successful.length}`);
  console.log(`  Failed: ${failed.length}`);
  console.log(`  Expected immediate: ${BURST_SIZE} (burst capacity)`);
  console.log(`  Expected rate-limited: ${10 - BURST_SIZE}`);
}

async function testSustainedLoad() {
  console.log("\n=== Testing Sustained Load ===");
  console.log(`Firing requests continuously for ${TEST_DURATION_MS/1000} seconds without waiting...\n`);
  
  const promises: Promise<{success: boolean, duration: number, result?: string, error?: string, requestNumber: number, startTime: number}>[] = [];
  const startTime = Date.now();
  let requestCount = 0;
  
  // Fire requests continuously without waiting
  while (Date.now() - startTime < TEST_DURATION_MS) {
    requestCount++;
    const requestNumber = requestCount;
    const requestStartTime = Date.now() - startTime;
    
    // Fire request without waiting
    const promise = callProcessMail(`sustained-${requestNumber}`).then(result => ({
      ...result,
      requestNumber,
      startTime: requestStartTime
    }));
    
    promises.push(promise);
    
    // Very small delay just to prevent CPU spinning
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  console.log(`Fired ${requestCount} requests. Waiting for all to complete...\n`);
  
  // Wait for all requests to complete
  const results = await Promise.all(promises);
  
  // Sort by completion time for display
  results.sort((a, b) => (a.startTime + a.duration) - (b.startTime + b.duration));
  
  // Display results
  results.forEach(result => {
    const startSec = Math.floor(result.startTime / 1000);
    const endSec = Math.floor((result.startTime + result.duration) / 1000);
    console.log(`Request ${result.requestNumber} [started: ${startSec}s, completed: ${endSec}s]: ${result.success ? 'Success' : 'Failed'} (${result.duration}ms)`);
  });
  
  const successCount = results.filter(r => r.success).length;
  const expectedMax = Math.floor((TEST_DURATION_MS / 60000) * RATE_LIMIT) + BURST_SIZE;
  
  console.log(`\nSummary:`);
  console.log(`  Total requests fired: ${requestCount}`);
  console.log(`  Successful: ${successCount}`);
  console.log(`  Failed (rate limited): ${requestCount - successCount}`);
  console.log(`  Expected max (with burst): ~${expectedMax}`);
  console.log(`  Success rate: ${(successCount / requestCount * 100).toFixed(1)}%`);
}

async function testBurstRecovery() {
  console.log("\n=== Testing Burst Recovery ===");
  console.log("Using burst capacity, then waiting for token replenishment...\n");
  
  // Use up burst capacity
  console.log("Phase 1: Using burst capacity");
  const burstPromises = Array.from({ length: BURST_SIZE }, (_, i) => 
    callProcessMail(`burst-${i + 1}`)
  );
  const burstResults = await Promise.all(burstPromises);
  console.log(`  Sent ${BURST_SIZE} requests, successful: ${burstResults.filter(r => r.success).length}`);
  
  // Try one more (should be rate limited)
  console.log("\nPhase 2: Exceeding burst capacity");
  const limitedResult = await callProcessMail(`burst-overflow`);
  console.log(`  Additional request: ${limitedResult.success ? 'Success' : 'Failed (expected)'}`);
  
  // Wait for token replenishment
  const waitTime = Math.ceil(60000 / RATE_LIMIT); // Time for 1 token
  console.log(`\nPhase 3: Waiting ${waitTime/1000}s for token replenishment...`);
  await new Promise(resolve => setTimeout(resolve, waitTime));
  
  // Try again
  const recoveredResult = await callProcessMail(`burst-recovered`);
  console.log(`  After waiting: ${recoveredResult.success ? 'Success (expected)' : 'Failed'}`);
}

async function testRapidFire() {
  console.log("\n=== Testing Rapid Fire (100 requests instantly) ===");
  console.log("Firing 100 requests as fast as possible...\n");
  
  const startTime = Date.now();
  
  // Fire 100 requests instantly
  const promises = Array.from({ length: 100 }, (_, i) => {
    const requestStartTime = Date.now() - startTime;
    return callProcessMail(`rapid-${i + 1}`).then(result => ({
      ...result,
      requestNumber: i + 1,
      startTime: requestStartTime
    }));
  });
  
  console.log("All 100 requests fired. Waiting for completion...\n");
  
  // Wait for all to complete
  const results = await Promise.all(promises);
  
  // Analyze timing
  const successfulRequests = results.filter(r => r.success);
  const failedRequests = results.filter(r => !r.success);
  
  console.log(`Results:`);
  console.log(`  Successful: ${successfulRequests.length}`);
  console.log(`  Failed: ${failedRequests.length}`);
  console.log(`  Expected successful: ${BURST_SIZE} (burst) + ${Math.floor(successfulRequests[successfulRequests.length - 1]?.duration / 60000 * RATE_LIMIT) || 0} (rate limited)`);
  
  // Show first few successes and failures
  console.log(`\nFirst ${Math.min(5, successfulRequests.length)} successful requests:`);
  successfulRequests.slice(0, 5).forEach(r => {
    console.log(`  Request ${r.requestNumber}: completed in ${r.duration}ms`);
  });
  
  if (failedRequests.length > 0) {
    console.log(`\nFirst ${Math.min(5, failedRequests.length)} failed requests:`);
    failedRequests.slice(0, 5).forEach(r => {
      console.log(`  Request ${r.requestNumber}: ${r.error}`);
    });
  }
}

async function main() {
  console.log("Rate Limiting Test Suite");
  console.log("========================\n");
  
  try {
    await setupRateLimiter();
    
    await testConcurrentRequests();
    await testBurstRecovery();
    await testRapidFire();
    await testSustainedLoad();
    
    console.log("\n✅ All tests completed!");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

// Run the test
main().catch(console.error);