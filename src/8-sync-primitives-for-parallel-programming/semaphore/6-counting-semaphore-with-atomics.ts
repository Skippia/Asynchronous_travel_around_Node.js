/**
 * ! The semaphore ensures that only a certain number of threads can perform the file operation concurrently.
 */

import fs from 'fs'
import threads from 'worker_threads'
import url from 'url'
const __filename = url.fileURLToPath(import.meta.url)

const { Worker, isMainThread } = threads

class CountingSemaphore {
  amountFreeThreads: Int32Array

  constructor(shared: SharedArrayBuffer, offset = 0, initial?: number) {
    this.amountFreeThreads = new Int32Array(shared, offset, 1)

    if (initial) {
      Atomics.store(this.amountFreeThreads, 0, initial)
    }
  }

  enter() {
    while (true) {
      /**
       * ? Frozes thread until amountFreeThreads will have at least one free slot
       * ? (initial amountFreeThreads f.e = 10 => move on)
       */
      Atomics.wait(this.amountFreeThreads, 0, 0)
      /**
       * ? Get actual info about amountFreeThreads
       */
      const n = Atomics.load(this.amountFreeThreads, 0)
      /**
       * ? If we don't have free threads - froze current thread
       */
      if (n > 0) {
        /**
         * ? It checks if the current value of amountFreeThreads[0] is still n.
         * ? If it's => decrease to 1
         */
        const prev = Atomics.compareExchange(this.amountFreeThreads, 0, n, n - 1)

        /**
         * ? If prev (the original value before the compareExchange operation) is the same as n,
         * ? it means our attempt to decrease the semaphore count was successful.
         * ? No other thread changed the value in the meantime.
         * ? If they aren't the same, it means another thread modified the value before we could,
         * ? so we didn't acquire the semaphore, and the loop continues.
         */
        if (prev === n) return
      }
    }
  }

  leave() {
    /**
     * ? current_state increases to 1 + notify
     */
    Atomics.add(this.amountFreeThreads, 0, 1)
    Atomics.notify(this.amountFreeThreads, 0, 1)
  }
}

if (isMainThread) {
  const MAX_PARALLEL_WORKERS = 5
  const AMOUNT_WORKERS = 20

  const buffer = new SharedArrayBuffer(4)
  const semaphore = new CountingSemaphore(buffer, 0, MAX_PARALLEL_WORKERS)

  console.dir({ semaphore: semaphore.amountFreeThreads[0] })

  for (let i = 0; i < AMOUNT_WORKERS; i++) {
    new Worker(__filename, { workerData: buffer })
  }
} else {
  const { threadId, workerData } = threads
  const semaphore = new CountingSemaphore(workerData)

  const REPEAT_COUNT = 10000000
  const data = `Data from ${threadId}`.repeat(REPEAT_COUNT)
  const file = `file-${threadId}.dat`

  console.dir({ threadId, semaphore: semaphore.amountFreeThreads[0] })

  semaphore.enter()

  //*  Here we create and delete heavy files async-y (inside critical section) - we don't have collisions
  fs.writeFileSync(file, data)

  /**
   * ? In root folder we can see how many parallel thread workers do their job at the moment of time
   */
  setTimeout(() => {
    fs.unlinkSync(file)
    semaphore.leave()
  }, 1000)
}
