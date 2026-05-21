import { createWorkflow, createStep } from '@mastra/core/workflows'
import { z } from 'zod'

export const candidateWorkflow = createWorkflow({
  id: 'candidate-workflow',
  inputSchema: z.object({
    resumeText: z.string(),
  }),
  outputSchema: z.object({
    askAboutSpecialty: z.object({
      question: z.string(),
    }),
    askAboutRole: z.object({
      question: z.string(),
    }),
  }),
}).commit()