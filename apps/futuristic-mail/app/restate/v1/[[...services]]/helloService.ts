import * as restate from "@restatedev/restate-sdk";

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
        }
    }
});

// Export the service
export default helloService;