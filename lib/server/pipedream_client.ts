import { createBackendClient } from "@pipedream/sdk/server";

// This code runs on your server
const pd = createBackendClient({
    environment: process.env.PIPEDREAM_ENVIRONMENT!,
    credentials: {
        clientId: process.env.PIPEDREAM_CLIENT_ID!,
        clientSecret: process.env.PIPEDREAM_CLIENT_SECRET!,
    },
    projectId: process.env.PIPEDREAM_PROJECT_ID!
});

export default pd;