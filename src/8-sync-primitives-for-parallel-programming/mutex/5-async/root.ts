/**
 * ? Analog of ../4-livelock-2.ts
 */

import threads, { isMainThread } from 'worker_threads'
import { Mutex } from './Mutex'
import url from 'url'
import { Thread } from './Thread'
const __filename = url.fileURLToPath(import.meta.url)

if (isMainThread) {
  Thread.workers = new Set()
  const buffer = new SharedArrayBuffer(4)
  const mutex = new Mutex(null, buffer, 0, true)

  console.dir({ mutex })

  new Thread(buffer, __filename)
  new Thread(buffer, __filename)
} else {
  const { threadId, workerData, parentPort } = threads
  const mutex = new Mutex(parentPort, workerData)

  setInterval(() => {
    console.log(`Interval ${threadId}`)
  }, 1000)

  const loop = () => {
    mutex.enter()
    console.log(`Enter ${threadId}`)

    setTimeout(() => {
      mutex.leave()
      console.log(`Leave ${threadId}`)

      setTimeout(loop, 0)
    }, 5000)
  }
  loop()
}
