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
  const buffer = new SharedArrayBuffer(8)
  const mutex1 = new Mutex(buffer, 0, true)
  const mutex2 = new Mutex(buffer, 4, true)
  console.dir({ mutex1, mutex2 })

  new Worker(__filename, { workerData: buffer })
  new Worker(__filename, { workerData: buffer })
} else {
  const { threadId, workerData } = threads
  const mutex1 = new Mutex(workerData)
  const mutex2 = new Mutex(workerData, 4)

  const loop = () => {
    mutex1.enter()

    console.log(`Entered mutex1 from worker${threadId}`)
    if (mutex1.leave()) console.log(`Left mutex1 from worker${threadId}`)

    mutex2.enter()

    console.log(`Entered mutex2 from worker${threadId}`)
    if (mutex2.leave()) console.log(`Left mutex2 from worker${threadId}`)

    setTimeout(loop, 0)
  }
  loop()
}
