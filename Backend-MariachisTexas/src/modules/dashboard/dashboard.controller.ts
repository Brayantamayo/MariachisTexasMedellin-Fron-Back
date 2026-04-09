import { Request, Response } from 'express'
import * as dashboardService from './dashboard.services'
import { asyncHandler } from '../../middlewares/Asynchandler'

export const getStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await dashboardService.getDashboardStats()
  res.json(stats)
})
