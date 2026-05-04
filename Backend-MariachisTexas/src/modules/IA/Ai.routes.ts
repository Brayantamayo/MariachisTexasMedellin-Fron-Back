import { Router } from 'express'
import { chatController } from './Ai.controller'

const aiRouter = Router()

aiRouter.post('/chat', chatController)

export default aiRouter