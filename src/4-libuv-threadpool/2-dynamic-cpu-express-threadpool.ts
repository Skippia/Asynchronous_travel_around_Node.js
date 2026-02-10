/**
 * ? In order to run stress test run - in terminal:
 * ! >>> autocannon http://localhost:3000
 * ? or
 * ! >>> autocannon http://localhost:3000 -d 60
 */

import os from 'os'
import express from 'express'
import helmet from 'helmet'
import bcrypt from 'bcrypt'
import { createServer } from 'http'

/**
 * ? By some unknown reason such configuration doesn't work (it doesn't affect to performance)
 * ? (even if i initialize UV_THREADPOOL_SIZE using .env file via dotenv.config())
 * ! The single way achieve setting UV_THREADPOOL_SIZE via using explicit option:
 * ! >>> UV_THREADPOOL_SIZE=12 node --experimental-specifier-resolution=node ./build/src/main.js
 * * or npm run start:performance
 */
//@ts-expect-error ...
process.env.UV_THREADPOOL_SIZE = os.cpus().length

export function dynamicCpuExpressThreadpool() {
  console.log('libuv threadpool size:', process.env.UV_THREADPOOL_SIZE || 4)

  const app = express()

  app.use(helmet())

  // Server Setup
  const port = 3000
  const server = createServer(app)

  server.listen(port, () => {
    console.log('NodeJS Performance Optimizations listening on: ', port)
  })

  /**
   * ! Approximately: in avg 700 requests per second
   */
  app.get('/bcrypt', async (req, res) => {
    const hash = await bcrypt.hash('this is a long password', 8)
    res.send(hash)
  })
}
