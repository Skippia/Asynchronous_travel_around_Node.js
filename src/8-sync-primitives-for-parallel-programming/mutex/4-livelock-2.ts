/**
 * ? A livelock is a situation where two or more threads or processes are actively
 * ? responding to each other's actions but without making any meaningful progress.
 * ? It's like two people who meet in a narrow corridor, and each tries
 * ? to step aside to let the other pass, but they end up swaying
 * ? from side to side without getting past each other.
 */

import threads from 'worker_threads'
import url from 'url'
import { Mutex } from './Mutex/Mutex-2'
const __filename = url.fileURLToPath(import.meta.url)
const { Worker, isMainThread } = threads

if (isMainThread) {
  const buffer = new SharedArrayBuffer(4)
  const mutex = new Mutex(buffer, 0, true)
  console.dir({ mutex })
  new Worker(__filename, { workerData: buffer })
  new Worker(__filename, { workerData: buffer })
} else {
  const { threadId, workerData } = threads
  const mutex = new Mutex(workerData)

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
