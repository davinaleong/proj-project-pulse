import http from 'http'
import createApp from './app'
import { ENV } from './config/env'

const app = createApp()
const server = http.createServer(app)

function start() {
  const port = ENV.PORT || 3000
  server.listen(port, () => {
    console.log(
      `Server listening on http://localhost:${port} (env=${ENV.NODE_ENV})`,
    )
  })

  const shutdown = (signal: string) => {
    console.log(`Received ${signal}. Closing server...`)
    server.close((err) => {
      if (err) {
        console.error('Error during server shutdown', err)
        process.exit(1)
      }
      console.log('Server shut down.')
      process.exit(0)
    })
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

if (require.main === module) {
  start()
}

export { server, start }
console.info('server.ts')
