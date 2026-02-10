/**
 * ? In order to run stress test run - in terminal:
 * ! >>> autocannon http://localhost:3000
 * ? or
 * ! >>> autocannon http://localhost:3000 -d 60
 */

import express from 'express'
import { createServer } from 'http'

export function bareMetalExpress() {
  const app = express()
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
