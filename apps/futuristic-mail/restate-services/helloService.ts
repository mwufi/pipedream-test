import * as restate from "@restatedev/restate-sdk";
import { Limiter } from "./ratelimit/limiter_client";

// Define the hello service
const helloService = restate.service({
    name: "hello",
    handlers: {
        // Handler that echoes "hello!"
        echo: async (ctx: restate.Context) => {
            return "hello!";
        },

        // Handler that can echo a custom message or default to "hello!"
        greet: async (ctx: restate.Context, message?: string) => {
            return message ? `hello, ${message}!` : "hello!";
        },

        processMail: async (ctx: restate.Context, mail: string) => {
            const limiter = Limiter.fromContext(ctx, "mail-processing");
            await limiter.wait();
            console.log("[mail-processing] Starting mail processing....");
            await ctx.sleep(1000);
            return `processing mail: ${mail}`;
        }
    }
});

export const helloWorkflow = restate.workflow({
    name: "helloWorkflow",
    handlers: {
        run: async (ctx: restate.Context) => {
            await ctx.sleep(20000);
            return "hello!";
        }
    }
});

// Export the service
export default helloService;