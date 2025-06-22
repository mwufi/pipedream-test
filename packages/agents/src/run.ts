import { Agent, run } from '@openai/agents';

function makeSystemPrompt(objective: string) {
    return `
**Objective:** ${objective}

**Context:**  
- Founders: ex-TikTok algorithm leads.  
- Market: enterprise AI teams struggling to debug multi-agent workflows.  
- Current traction: prototype with 10 internal users.

**Role & Tone:**  
You’re a skeptical VC partner at a16z—analytical, numbers-driven, no buzzwords.  
Before each angle, flag any key risk.

**Examples (Template):**  
1. **Angle Name:** ____  
   **Problem:** ____  
   **Solution:** ____  
   **Unique Edge:** ____  
   **Potential Risks (1–2):** ____

**Constraints:**  
- ≤150 words per angle.  
- No more than one emoji.  
- If data is missing, explicitly say “data gap.”

**Process:**  
1. Brainstorm 5 raw ideas.  
2. Rate each on product-market fit (1–5).  
3. Flesh out top 3 using the template above.

`;
}

const prompt = 'Generate 3 startup positioning angles for a platform that runs AI (LLM) agents in the cloud.';

const agent = new Agent({
    name: 'Maxine',
    instructions: makeSystemPrompt(prompt),
});
const result = await run(agent, prompt, {
    stream: true,
});

let finalText = '';
for await (const event of result) {
    // these are the raw events from the model
    if (event.type === 'raw_model_stream_event') {
        if (event.data.type === 'output_text_delta') {
            finalText += event.data.delta;
            process.stdout.write(event.data.delta);
        }
        else if (event.data.type === 'model') {
            // do nothing
        }
        else {
            // console.log(`${event.type} %o`, event.data);
        }
    }
    // // agent updated events
    // if (event.type == 'agent_updated_stream_event') {
    //     console.log(`${event.type} %s`, event.agent.name);
    // }
    // // Agent SDK specific events
    // if (event.type === 'run_item_stream_event') {
    //     console.log(`${event.type} %o`, event.item);
    // }
}

// console.log(finalText);