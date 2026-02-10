/* eslint-disable @typescript-eslint/ban-ts-comment */
import express from 'express'
import dotenv from 'dotenv'
import http from 'http'
import bcryptjs from 'bcryptjs'
import bcrypt from 'bcrypt'
import { initWorkerPool, getWorkerPoolProxy } from './worker-pool/controller'
import { WorkerPoolOptions } from 'workerpool'
import path from 'path'
import url from 'url'
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

/**
 * ? In order to disable levarage of WorkerPool - set in .env file: WORKER_POOL_ENABLED="0"
 * ? In order to enable levarage of WorkerPool - set in .env file: WORKER_POOL_ENABLED="1"
 */

/**
 * ! For sync function in workerpools
 * ! we have kinda "memory leaks", but "request leaks".
 * ! With each new load test we ~double slow application:
 * ! (f.e for 6 worker threads:
 * ! 6.5 -> 4.4 -> 2.4 -> 1.3 -> 0.9k req/sec)
 * My suggestion is autocannon loads too intensively app
 * and it accumulates all these requests which can't handle on time
 * (but i'm not sure)
 */

/**
 * ! Conclusion:
 * * Code is run in main thread
   Threadpools  | async supports | sync | async doesn't support |
      amount    |                |      |    threadpools        |
-----------------------------------------------------------------
|       1       |       85       |  60  |          85           |
-----------------------------------------------------------------
|       2       |       170      |
----------------------------------
|       3       |       262      |
----------------------------------
|       4       |       342      |
----------------------------------
|       8       |       602      |
----------------------------------
|      12      |        677      |
----------------------------------
*/

/**
 * ! Conclusion:
 * * Code is run in workerpool
 * * Workerpool enabled = 1 worker threads in workerpool (min-max)
  Threadpools  | async supports | sync | async doesn't support |
     amount    |  threadpools   |      |    threadpools        |
----------------------------------------------------------------
|      1       |       85       | 8700 |          60           |
----------------------------------------------------------------
|      2       |       53       |
---------------------------------
|      3       |       87       |
---------------------------------
|      4       |       46       |
---------------------------------
|      8       |       38       |
---------------------------------
|     12       |       41       |
---------------------------------
*/

/**
 * ! Conclusion:
 * * Code is run in workerpool
 * * Workerpool enabled = 2 worker threads in workerpool (min-max)
  Threadpools  | async supports | sync | async doesn't support |
     amount    |  threadpools   |      |    threadpools        |
----------------------------------------------------------------
|      1       |      85        | 8400 |         120           |
----------------------------------------------------------------
|      2       |      170       |
---------------------------------
|      3       |      120       |
---------------------------------
|      4       |      170       |
---------------------------------
|      8       |      90        |
---------------------------------
|      12      |      86        |
---------------------------------
 */

/**
 * ! Conclusion:
 * * Code is run in workerpool
 * * Workerpool enabled = 4 worker threads in workerpool (min-max)
  Threadpools  | async supports | sync | async doesn't support |
     amount    |  threadpools   |      |    threadpools        |
----------------------------------------------------------------
|      1       |      85        | 7300 |         230           |
----------------------------------------------------------------
|      2       |      170       |
---------------------------------
|      3       |      261       |
---------------------------------
|      4       |      336       |
---------------------------------
|      8       |      262       |
---------------------------------
|     12       |      285       |
---------------------------------

 */
/**
 * ! Conclusion:
 * * Code is run in workerpool
 * * Workerpool enabled = 6 worker threads in workerpool (min-max)
  Threadpools  | async supports | sync | async doesn't support |
     amount    |  threadpools   |      |    threadpools        |
----------------------------------------------------------------
|      1       |      85        | 6500 |           300         |
----------------------------------------------------------------
|      2       |      170       |
---------------------------------
|      3       |      261       |
---------------------------------
|      4       |      336       |
---------------------------------
|      8       |      460       |
---------------------------------
|     12       |      460       |
---------------------------------
 */

/**
 * ! Conclusion:
 * * Code is run in workerpool
 * * Workerpool enabled = 11 worker threads in workerpool (min-max)
  Threadpools  | async supports | sync | async doesn't support |
     amount    |  threadpools   |      |    threadpools        |
----------------------------------------------------------------
|      1      |      85        |  4700 |         330           |
----------------------------------------------------------------
|      2      |      170       |
--------------------------------
|      3      |      261       |
--------------------------------
|      4      |      330       |
--------------------------------
|      8      |      600       |
--------------------------------
|     12      |      585       |
--------------------------------
*/

type TFunctionType = 'sync' | 'async-with-threadpools' | 'async-without-threadpools'

export const functionType: TFunctionType = 'sync'
// export const functionType: TFunctionType = 'async-with-threadpools'
// export const functionType: TFunctionType = 'async-without-threadpools'

export const functionTypeMap = {
  sync: (password: string) => bcrypt.hashSync(password, 8),
  'async-with-threadpools': (password: string) => bcrypt.hash(password, 8),
  'async-without-threadpools': (password: string) => bcryptjs.hash(password, 8),
}

export async function workerPoolRun({ workersInWorkerpool }: { workersInWorkerpool: number }) {
  dotenv.config()

  const isWorkerPoolEnabled = process.env.WORKER_POOL_ENABLED === '1'

  console.log('Threadpools amount:', process.env.UV_THREADPOOL_SIZE || 4)
  console.log('Workerool mode: ', isWorkerPoolEnabled)
  console.log('Function mode for Workerpool: ', functionType)

  const app = express()

  // Router Setup
  app.get('/bcrypt', async (req, res) => {
    const password = 'This is a long password'

    let result: string | null = null

    if (isWorkerPoolEnabled) {
      // * 2. Use workerpool
      const workerPool = getWorkerPoolProxy()

      if (functionType === 'sync') {
        //@ts-ignore 123
        result = workerPool.bcryptFunction(password)
      } else {
        //@ts-ignore 123
        result = await workerPool.bcryptFunction(password)
      }
    } else {
      // * 1. Invoke function in main thread
      /**
       * ? 4 threads: Avg: 60 requests per second
       * ? 12 threads: Avg: 60 requests per second
       * ! Explanation: because we use sync function
       * ! and can't aleviate load on EL without worker threads
       */

      if (functionType === 'sync') {
        result = functionTypeMap[functionType](password)
      } else {
        result = await functionTypeMap[functionType](password)
      }
    }

    res.send(result)
  })

  app.get('/heavy-worker-improved', async (req, res) => {
    if (!isWorkerPoolEnabled) {
      res.status(200).send(`Workerpool is disabled. Can't check performance`)
    }

    const id = MeasurePerformance.start()

    const workerPool = getWorkerPoolProxy()

    const counter = await workerPool.calculateCountSync()

    const duration = MeasurePerformance.end(id, false)
    res.status(200).send(`counter is ${counter} - ${duration}`)
  })

  // Server Setup
  const port = process.env.PORT
  const server = http.createServer(app)

  // Init Worker Pool
  if (isWorkerPoolEnabled) {
    try {
      const options: WorkerPoolOptions = {
        minWorkers: workersInWorkerpool,
        maxWorkers: workersInWorkerpool,
      }
      //* 1. Initialize workerpool
      const workerPath = path.join(__dirname, './worker-pool/bcrypt-workerpool.js')
      await initWorkerPool(workerPath, options)
    } catch (err) {
      console.log('error', err)
    }
  }

  // Start Server
  server.listen(port, () => {
    console.log('NodeJS workerpool app on: ', port)
  })
}
