import { Mastra } from '@mastra/core'
import { chefAgent } from './agents/chefAgent'
import { stockAgent } from './agents/stockAgent'
export const mastra = new Mastra({
  agents: { chefAgent, stockAgent },
})