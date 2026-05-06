import { z } from 'zod'

export const ChatTurnSchema = z.object({
  role: z.enum(['user', 'model']),
  text: z.string(),
})

export const ChatSchema = z.object({
  message: z.string().min(1, 'El mensaje no puede estar vacío'),
  history: z.array(ChatTurnSchema).max(50).default([]),
})

export type ChatDto = z.infer<typeof ChatSchema>
export type ChatTurn = z.infer<typeof ChatTurnSchema>