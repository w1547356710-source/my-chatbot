import { createTool } from '@mastra/core/tools'
import { z } from 'zod'

export const weatherTool = createTool({
  id: 'weather-tool',
  description: 'Fetches weather for a location',
  inputSchema: z.object({
    location: z.string(),
  }),
  outputSchema: z.object({
    weather: z.string(),
  }),
  execute: async inputData => {
    const { location } = inputData

    const response = await fetch(`https://wttr.in/${location}?format=3`)
    const weather = await response.text()

    return { weather }
  },
})