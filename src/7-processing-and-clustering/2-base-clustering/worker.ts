import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import { createServer } from 'http'

const app = express()

app.use(helmet())
app.use(morgan('combined'))

app.use(
  morgan('combined', {
    skip: (req, res) => {
      return res.statusCode < 400
    },
  })
)

// Server Setup
const port = 3000
const server = createServer(app)

server.listen(port, () => {
  console.log(`Process child with pid = ${process.pid} listens port = ${port}`)
})

/**
 * ! In average:
 * ? 1 process - 5300 req/sec
 * ? 2 process - 8300 req/sec
 * ? 10 process - ..
 */
app.get('/test', (req, res) => {
  res.send('')
})

/**
 * * Initiate `graceful shutdown`
 * * In order to trigger this signal:
 * ? >>> CTRL + C
 */
process.on('SIGINT', () => {
  console.log('Signal is SIGINT')
  server.close(() => {
    process.exit(0)
  })
})

/**
 * * Initiate `graceful shutdown`
 * * In order to trigger this signal:
 * ? >>> kill pid
 */
process.on('SIGTERM', () => {
  console.log('Signal is SIGTERM')
  server.close(() => {
    process.exit(0)
  })
})

/**
 * * SIGUSR1 signal is set for debugger
 * * In order to trigger this signal:
 * ? >> kill -s SIGUSR2 pid
 */
process.on('SIGUSR2', () => {
  console.log('Signal is SIGUSR2')
  server.close(() => {
    process.exit(1)
  })
})
