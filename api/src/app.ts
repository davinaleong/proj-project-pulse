import express, { Request, Response, NextFunction } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { ENV } from './config/env'

export function createApp() {
  const app = express()

  // Basic middleware
  app.use(helmet())
  app.use(cors())
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  // Simple request logger (development)
  if (ENV.NODE_ENV === 'development') {
    app.use((req: Request, _res: Response, next: NextFunction) => {
      // lightweight logger to avoid depending on logger implementation
      // (projects may replace with pino or similar)
      // eslint-disable-next-line no-console
      console.log(`${req.method} ${req.url}`)
      next()
    })
  }

  // Health check
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', env: ENV.NODE_ENV })
  })

  // Basic error handler — specific app error handler can be mounted after createApp is called
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    // mark next as used to satisfy unused var checks
    void _next

    let message = 'Internal Server Error'
    if (typeof err === 'string') message = err
    else if (typeof err === 'object' && err !== null && 'message' in err) {
      const maybeMessage = (err as Record<string, unknown>)['message']
      if (typeof maybeMessage === 'string') message = maybeMessage
    }

    // log the error for diagnostics
    console.error('Unhandled error:', err)
    res.status(500).json({ error: message })
  })

  return app
}

export default createApp
