/**
 * ? A deadlock is a situation where two or more threads or processes are unable to proceed
 * ? with their execution because each one is waiting for the other(s) to release a resource.
 * ? This creates a circular wait condition where no progress can be made.
 */
/**
 * ? 1. Thread #1 enters in mutex #1
 * ? 1. Thread #2 enters in mutex #2
 * ? 2. Thread #1 tries to enter in mutex #2 and waits
 * ? 2. Thread #2 tries to enter in mutex #1 and waits
 */

import threads from 'worker_threads'
import url from 'url'
import { Mutex } from './Mutex/Mutex-2'
const __filename = url.fileURLToPath(import.meta.url)

const { Worker, isMainThread } = threads

if (isMainThread) {
  const buffer = new SharedArrayBuffer(8)
  /**
   * ? Do pre-initialization - make both of mutex unlocked
   */
  const mutex1 = new Mutex(buffer, 0, true)
  const mutex2 = new Mutex(buffer, 4, true)
  console.dir({ mutex1, mutex2 })

  new Worker(__filename, { workerData: buffer })
  new Worker(__filename, { workerData: buffer })
} else {
  const { threadId, workerData } = threads
  const mutex1 = new Mutex(workerData)
  const mutex2 = new Mutex(workerData, 4)

  if (threadId === 1) {
    mutex1.enter()
    console.log('[1] Entered mutex1 from worker1')

    setTimeout(() => {
      mutex2.enter()

      console.log('[1] Entered mutex2 from worker1')

      if (mutex1.leave()) console.log('Left mutex1 from worker1')
      if (mutex2.leave()) console.log('Left mutex2 from worker1')
    }, 100)
  } else {
    mutex2.enter()
    console.log('[2] Entered mutex2 from worker2')

    // Uncomment to fix deadlock
    // if (mutex2.leave()) console.log('Left mutex2 from worker2')

    setTimeout(() => {
      mutex1.enter()

      console.log('[2] Entered mutex1 from worker2')

      if (mutex2.leave()) console.log('Left mutex2 from worker2')
      if (mutex1.leave()) console.log('Left mutex1 from worker2')
    }, 100)
  }
}
