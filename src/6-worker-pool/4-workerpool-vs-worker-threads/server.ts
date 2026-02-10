/* eslint-disable @typescript-eslint/ban-ts-comment */
import express from 'express'
import dotenv from 'dotenv'
import http from 'http'
import { WorkerPoolOptions } from 'workerpool'
import { chunkify } from './helpers'
import { getWorkerPoolProxy, initWorkerPool } from '../2-bcrypt-experiments/worker-pool/controller'
import path from 'path'
import url from 'url'
import { runInWorkerpool } from './workerpool/run-in-workerpool'
import { runInWorkerThreads } from './worker-threads/run-in-worker-threads'
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

/**
 * ? In order to disable levarage of WorkerPool - set in .env file: WORKER_POOL_ENABLED="0"
 * ? In order to enable levarage of WorkerPool - set in .env file: WORKER_POOL_ENABLED="1"
 */

/**
   * ! Conclusion:
  --------------------------------------------------------------------------------------------
  |       Workerpool        |   concurrent   |   concurrent  |   concurrent  |   concurrent  |
  |                         |  per task = 1  |  per task = 2 |  per task = 3 |  per task = 4 |
  --------------------------------------------------------------------------------------------
  | parallel requests = 1  |      16.5s     |
  --------------------------------------------------------------------------------------------
  | parallel requests = 2  |      9.2s      |      9.9s     |      10.6s    |       12s      |
  --------------------------------------------------------------------------------------------
  | parallel requests = 3  |      6.3s      |      7s       |      9.5s     |      11.7s     |
  --------------------------------------------------------------------------------------------
  | parallel requests = 4  |      4.7s      |      6.4s     |      8.3s     |      11s       |
  --------------------------------------------------------------------------------------------
 */

/**
   * ! Conclusion:
  --------------------------------------------------------------------------------------------
  | Dynamic worker threads |   concurrent   |   concurrent  |   concurrent  |   concurrent   |
  |                        |  per task = 1  |  per task = 2 |  per task = 3 |  per task = 4  |
  --------------------------------------------------------------------------------------------
  | parallel requests = 1  |      16.5s     |
  --------------------------------------------------------------------------------------------
  | parallel requests = 2  |      9.2s      |      9.9s     |     10.6s     |      12s       |
  --------------------------------------------------------------------------------------------
  | parallel requests = 3  |      6.3s      |      7s       |     9.5s      |     11.7s      |
  --------------------------------------------------------------------------------------------
  | parallel requests = 4  |      4.7s      |      6.4s     |     8.3s      |     11s        |
  --------------------------------------------------------------------------------------------
 */
export async function workerpoolVsWorkerthreads({
  mode,
  concurrentWorkers,
  workerpoolMax,
}: {
  mode: 'workerpool' | 'worker-threads'
  concurrentWorkers: number
  workerpoolMax?: number
}) {
  dotenv.config()

  const jobs = Array.from({ length: 100 }, () => 1_000_000_000)
  const isWorkerPoolEnabled = process.env.WORKER_POOL_ENABLED === '1' && mode === 'workerpool'
  const port = process.env.PORT

  const app = express()
  const server = http.createServer(app)
  const chunks = chunkify(jobs, concurrentWorkers)

  if (isWorkerPoolEnabled) {
    if (!workerpoolMax) {
      throw new Error('You shoud define workerpoolMax!')
    }

    try {
      const options: WorkerPoolOptions = {
        minWorkers: workerpoolMax,
      }

      //* 1. Initialize workerpool
      const workerPath = path.join(__dirname, './workerpool/heavy-task-workerpool.js')

      await initWorkerPool(workerPath, options)
    } catch (err) {
      console.log('error', err)
    }
  }

  server.listen(port, () => {
    console.log('NodeJS app on: ', port)
    console.log(`Run in mode: ${mode}, concurrent workers per task: ${concurrentWorkers}`)

    if (workerpoolMax) {
      console.log('Workerpool amount', workerpoolMax)
    }
  })

  // Router Setup
  app.get('/test', async (req, res) => {
    const id = MeasurePerformance.start()
    let responseTotal: number

    if (isWorkerPoolEnabled) {
      const workerPoolProxy = getWorkerPoolProxy()
      const total = await runInWorkerpool({
        workerPoolProxy,
        chunks,
        concurrentWorkers,
      })
      responseTotal = total
    } else {
      const total = await runInWorkerThreads(chunks, concurrentWorkers)
      responseTotal = total
    }

    const duration = MeasurePerformance.end(id, false)
    res.send(`Response: ${responseTotal}, ${duration}`)
  })
}
