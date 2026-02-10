/**
 * ? In order to run stress test run - in terminal:
 * ! >>> autocannon http://localhost:3000
 * ? or
 * ! >>> autocannon http://localhost:3000 -d 60
 */
import express from 'express'
import helmet from 'helmet'
import bcrypt from 'bcrypt'
import bcryptjs from 'bcryptjs'
import { createServer } from 'http'
// import dotenv from 'dotenv'

// dotenv.config()

export function defaultExpressThreadpool() {
  console.log('libuv threadpool size:', process.env.UV_THREADPOOL_SIZE || 4)
  const port = 3000

  const app = express()
  app.use(helmet())

  const server = createServer(app)

  server.listen(port, () => {
    console.log('NodeJS Default Performance listening on: ', port)
  })

  app.get('/bcrypt', async (req, res) => {
    /**
     * ! Approximately: in avg requests per second:
     * ? 1 thread - 87
     * ? 2 threads - 171
     * ? 4 threads - 300
     * ? 8 threads - 500
     * ? 11 threads - 520
     * ? 12 threads - 520
     * ? 1000 threads - 495
     * ! Conclusion: it speeds up with grow of threadpool but non-linearly
     * ! (after 8 logic cores ~~ doesn't affect to performance)
     */
    const hash = await bcrypt.hash('this is a long password', 8)
    /**
     * * Proof that bcryptjs.hash is async function in
     * * >>> 1-event-loop/tasks-event-loop/blocking-and-non-blocking-event-loop/bcryptjs_proof_async.ts
     * ! Approximately: in avg requests per second:
     * ? 1 thread - 51
     * ? 2 threads - 51
     * ? 4 threads - 51
     * ? 8 threads - 51
     * ? 11 threads - 51
     * ? 12 threads - 51
     * ? 1000 threads - 51
     * ! Conclusion: bcryptjs library it's async function, but doesn't use
     * ! libuv threadpools under the hood (unlike of bcrypt library)
     */
    // const hash = await bcryptjs.hash('this is a long password', 8)
    /**
     * * Proof that bcryptjs.hashSync is sync function in
     * * >>> 1-event-loop/tasks-event-loop/blocking-and-non-blocking-event-loop/bcryptjs_proof_sync.ts
     * ! Approximately: in avg requests per second:
     * ? 1 thread - 74
     * ? 2 threads - 74
     * ? 4 threads - 74
     * ? 8 threads - 74
     * ? 11 threads - 74
     * ? 12 threads - 74
     * ? 1000 threads - 74
     * ! Conclusion: bcrypt.hashSync it's sync function.
     * ! libuv threadpools are useless
     */
    // const hash = bcrypt.hashSync('this is a long password', 8)
    res.send(hash)
  })
}
