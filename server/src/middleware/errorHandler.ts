import type { Request, Response, NextFunction } from 'express'

import { ZodError } from 'zod'

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ZodError) {
    const zodErr = err as any
    res.status(400).json({
      error: 'Validation Error',
      details: zodErr.errors ? zodErr.errors.map((e: any) => ({
        path: e.path ? e.path.join('.') : '',
        message: e.message,
      })) : zodErr.issues,
    })
    return
  }

  if (err.name === 'UnauthorizedError') {
    res.status(401).json({ error: 'Unauthorized', details: err.message })
    return
  }

  console.error('Unhandled Server Error:', err)
  res.status(500).json({ error: 'An unexpected error occurred.', details: err?.message || String(err) })
}
