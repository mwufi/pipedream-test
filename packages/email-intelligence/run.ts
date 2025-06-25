import { Agent } from "@openai/agents";

const agent = new Agent({
    name: "Email Intelligence",
    instructions: "You are a helpful assistant that can analyze emails and provide insights.",
});