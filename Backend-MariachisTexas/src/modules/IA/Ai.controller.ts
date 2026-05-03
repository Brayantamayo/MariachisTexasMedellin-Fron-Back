import { Request, Response } from 'express'
import { ChatSchema } from './dto/Chat.dto'
import { chatWithGroq } from './Ai.service'  // ← cambio aquí

export const chatController = async (req: Request, res: Response): Promise<void> => {
  const result = ChatSchema.safeParse(req.body)

  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() })
    return
  }

  try {
    const { message, history } = result.data
    const reply = await chatWithGroq(message, history)  // ← cambio aquí
    res.status(200).json({ reply })
  } catch (err: any) {
    console.error('[AI Controller]', err?.message)
    res.status(500).json({ error: 'Error al contactar con el servicio de IA' })
  }
}