
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { weatherWorkflow } from './workflows/weather-workflow';
import { rolePlayAgent } from './agents/roleplay-agent';
import { emailAgent } from './agents/email-agent';
import { rigorousAgent } from './agents/rigorous';

export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: { rolePlayAgent, emailAgent, rigorousAgent },
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
