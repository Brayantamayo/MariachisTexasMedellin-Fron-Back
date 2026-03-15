import { Request, Response, NextFunction } from 'express'

type AsyncFn = (req: any, res: Response, next: NextFunction) => Promise<any>

/**
 * Wrapper que elimina el try/catch repetitivo en cada controller.
 * Si el service lanza un error, lo captura y responde con el status correcto.
 *
 * Uso:
 *   export const getAll = asyncHandler(async (req, res) => {
 *     res.json(await service.getAll())
 *   })
 */
export const asyncHandler = (fn: AsyncFn, errorStatus = 400) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next)
    } catch (e: any) {
      res.status(errorStatus).json({ message: e.message })
    }
  }