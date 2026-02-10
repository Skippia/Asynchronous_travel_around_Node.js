import { Worker } from 'worker_threads'
import express from 'express'
import helmet from 'helmet'
import { createServer } from 'http'
import { calculateCountSync, calculateCountAsync } from './helpers'
import url from 'url'
import path from 'path'
import bcrypt from 'bcrypt'
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

function createWorker(relativePath: string, thread_count: number) {
  return new Promise<number>(function (resolve, reject) {
    const worker = new Worker(path.join(__dirname, relativePath), {
      workerData: { thread_count },
    })

    worker.on('message', (data: number) => {
      resolve(data)
    })
    worker.on('error', (msg) => {
      reject(`An error ocurred: ${msg}`)
    })
  })
}

export function expressWorkerThread() {
  console.log('libuv threadpool size:', process.env.UV_THREADPOOL_SIZE || 4)

  const port = 3000
  const app = express()

  app.use(helmet())

  const server = createServer(app)

  server.listen(port, () => {
    console.log('NodeJS Default Performance listening on: ', port)
  })

  app.get('/non-blocking/', (req, res) => {
    res.status(200).send('This page is non-blocking')
  })

  // ❌❌❌ - don't know why
  app.get('/blocking-sync', async (req, res) => {
    /**
     * ? Approximately 16.4s
     * ! But after 3rd request and the next ones takes 4x slower (~70s)
     */
    const id = MeasurePerformance.start()

    const counter = calculateCountSync()

    const duration = MeasurePerformance.end(id, false)
    res.status(200).send(`counter is ${counter} - ${duration}`)
  })

  // ❌❌❌ - don't know why
  app.get('/blocking-async', async (req, res) => {
    /**
     * ? It has absolutely equal behavior as /blocking-sync. If one of users tries to get this endpoint,
     * ? no one could make any (f.e) get-request until this request will not be completed
     * ? (because main thread is blocked)
     */
    /**
     * ? Approximately 16.4s
     * ! But after 3rd request and the next ones takes 4x slower (~70s)
     */

    const id = MeasurePerformance.start()

    const counter = await calculateCountAsync()
    /**
     * ! It doesn't matter if we have await or not
     * ! it will block event loop anyway
     */
    // const counter = calculateCountAsync();
    const duration = MeasurePerformance.end(id, false)
    res.status(200).send(`counter is ${counter} - ${duration}`)
  })

  app.get('/non-blocking-async', async (req, res) => {
    const counter = await bcrypt.hash('12345678910', 15)

    res.status(200).send(`counter is ${counter}`)
  })

  // ✅✅✅ - works perfectly
  app.get('/heavy-worker', async (req, res) => {
    /**
     * ? Approximately 16.6s (always unlike prev)
     *
     * ! Doesn't block event loop!
     * ? Blocks only current user (who made reques) - because it takes time
     * ? to perform calculation, but main thread works great
     */
    const id = MeasurePerformance.start()

    const counter = await createWorker('./1-worker-thread.js', 1)

    const duration = MeasurePerformance.end(id, false)
    res.status(200).send(`counter is ${counter} - ${duration}`)
  })

  /**
   * ! Conclusion:
                        |    parallel    |    parallel   |    parallel   |    parallel   |
                        |  requests = 1  |  requests = 2 |  requests = 3 |  requests = 4 |
  ----------------------------------------------------------------------------------------
  | Worker threads = 1  |      16.5s     |
  ----------------------------------------------------------------------------------------
  | Worker threads = 2  |      9.2s      |      9.9s     |     10.6s     |      12s      |
  ----------------------------------------------------------------------------------------
  | Worker threads = 3  |      6.3s      |      7s       |     9.5s      |     11.7s     |
    ----------------------------------------------------------------------------------------
  | Worker threads = 4  |      4.7s      |      6.4s     |     8.3s      |     11s       |
  ----------------------------------------------------------------------------------------
  | Worker threads = 6  |      4s        |      6.5s     |     9.3s      |     12.5s     |
  ----------------------------------------------------------------------------------------
  | Worker threads = 8  |      3.6s      |      6s       |     8.8s      |     11.5s     |
  ----------------------------------------------------------------------------------------
 */
  app.get('/heavy-worker-improved', async (req, res) => {
    /**
     * ! Doesn't block event loop!
     * ? Works much faster, but speed of execution
     * ? doesn't grow linearly
     */
    const id = MeasurePerformance.start()

    const THREAD_COUNT = 6

    const workerPromises: Promise<number>[] = []

    for (let i = 0; i < THREAD_COUNT; i++) {
      workerPromises.push(createWorker('./2-four-worker-thread.js', THREAD_COUNT))
    }

    const thread_results = await Promise.all(workerPromises)
    let counter = 0

    for (let i = 0; i < THREAD_COUNT; i++) {
      counter += thread_results[i]
    }

    const duration = MeasurePerformance.end(id, false)
    res.status(200).send(`counter is ${counter} - ${duration}`)
  })
}
