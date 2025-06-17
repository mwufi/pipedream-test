import { init } from "@instantdb/admin";
import schema from "@/instant.schema";

// Initialize InstantDB admin client for server-side operations
// Requires INSTANT_ADMIN_TOKEN environment variable to be set
// You can get this from your InstantDB dashboard
const adminDb = init({
    appId: "b6c62e9f-d6c9-4722-9242-6263312dd44d",
    adminToken: process.env.INSTANT_ADMIN_TOKEN!,
    schema: schema,
});

export default adminDb;