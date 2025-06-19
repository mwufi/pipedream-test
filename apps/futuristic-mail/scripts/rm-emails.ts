import adminDb from "@/lib/instant_serverside_db";

// Helper function to chunk array into smaller arrays
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
}

async function removeAllEmails() {
    console.log("Starting to remove all emails...");
    const overallStartTime = Date.now();

    try {
        // Query all emails
        const result = await adminDb.query({
            emails: {
                $: {}
            }
        });

        if (!result.emails || result.emails.length === 0) {
            console.log("No emails found to remove");
            return;
        }

        console.log(`Found ${result.emails.length} emails to remove`);

        // Chunk emails into batches of 20
        const emailChunks = chunkArray(result.emails, 50);
        console.log(`Processing ${emailChunks.length} batches of up to 50 emails each`);

        let totalDeleted = 0;
        const batchTimes: number[] = [];

        // Process each chunk
        for (let i = 0; i < emailChunks.length; i++) {
            const chunk = emailChunks[i];
            console.log(`Processing batch ${i + 1}/${emailChunks.length} (${chunk.length} emails)...`);

            const batchStartTime = Date.now();

            // Delete emails in this chunk
            await adminDb.transact(
                chunk.map(email =>
                    adminDb.tx.emails[email.id].delete()
                )
            );

            const batchEndTime = Date.now();
            const batchDuration = batchEndTime - batchStartTime;
            batchTimes.push(batchDuration);

            totalDeleted += chunk.length;
            console.log(`Batch ${i + 1} completed in ${batchDuration}ms. Total deleted so far: ${totalDeleted}/${result.emails.length}`);
        }

        const overallEndTime = Date.now();
        const overallDuration = overallEndTime - overallStartTime;
        const averageBatchTime = batchTimes.reduce((sum, time) => sum + time, 0) / batchTimes.length;

        console.log(`Successfully removed all ${totalDeleted} emails`);
        console.log(`Total time: ${overallDuration}ms (${(overallDuration / 1000).toFixed(2)}s)`);
        console.log(`Average batch time: ${averageBatchTime.toFixed(1)}ms`);
        console.log(`Average emails per second: ${(totalDeleted / (overallDuration / 1000)).toFixed(1)}`);

    } catch (error) {
        console.error("Error removing emails:", error);
        throw error;
    }
}

// Execute the function
removeAllEmails()
    .then(() => {
        console.log("Email removal completed successfully");
        process.exit(0);
    })
    .catch((error) => {
        console.error("Email removal failed:", error);
        process.exit(1);
    });
