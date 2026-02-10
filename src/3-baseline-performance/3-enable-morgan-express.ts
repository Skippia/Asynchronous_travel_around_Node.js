/**
 * ? In order to run stress test run - in terminal:
 * ! >>> autocannon http://localhost:3000
 * ? or
 * ! >>> autocannon http://localhost:3000 -d 60
 */

import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import { createServer } from 'http'

export function bareMetalExpress() {
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

  const port = 3000
  const server = createServer(app)

  server.listen(port, () => {
    console.log('NodeJS Performance Optimizations listening on: ', port)
  })

  // TODO: add info avg req
  app.get('/', (req, res) => {
    res.send('')
  })
}
