import { Agent } from '@mastra/core/agent'
import { stockPrices } from '../tools/stockPrices'
export const stockAgent = new Agent({
  id: 'stock-agent',
  name: 'Stock Agent',
  instructions:
    'You are a helpful assistant that provides current stock prices. When asked about a stock, use the stock price tool to fetch the stock price.',
  model: 'deepseek/deepseek-v4-flash',
  tools: {
    stockPrices,
  },
})