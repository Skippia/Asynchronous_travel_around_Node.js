/**
 * ? Regualar binary semaphore, but
 * ? slightly different implementation
 */

import threads from 'worker_threads'
const { Worker, isMainThread } = threads

import url from 'url'
const __filename = url.fileURLToPath(import.meta.url)

const LOCKED = 0
const UNLOCKED = 1

class BinarySemaphore {
  /**
   * ! It should be Int32Array element, because Atomics.wait doesn't suppoert another data type
   */
  lock: Int32Array

  constructor(shared: SharedArrayBuffer, offset = 0, init = false) {
    this.lock = new Int32Array(shared, offset, 1)
    if (init) Atomics.store(this.lock, 0, UNLOCKED)
  }

  enter() {
    /**
     * ? [From the viewpoint thread #1]: prev is unlocked, current_state is locked
     * ? [From the viewpoint thread #2]: prev is locked, current_state is locked -> locks itself
     */
    let prev = Atomics.exchange(this.lock, 0, LOCKED)
    while (prev !== UNLOCKED) {
      /**
       * ? Froze thread until current_state is locked
       */
      Atomics.wait(this.lock, 0, LOCKED)

      /**
       * ? When current_state becomes unlocked,
       * ? prev = unlocked, current_state becomes locked -> exit from while
       */
      prev = Atomics.exchange(this.lock, 0, LOCKED)
    }
  }

  leave() {
    if (Atomics.load(this.lock, 0) === UNLOCKED) {
      throw new Error('Cannot leave unlocked BinarySemaphore')
    }
    /**
     * ? current_state becomes unlocked + notify
     */
    Atomics.store(this.lock, 0, UNLOCKED)
    Atomics.notify(this.lock, 0, 1)
  }
}

// Usage

if (isMainThread) {
  const buffer = new SharedArrayBuffer(14)
  const semaphore = new BinarySemaphore(buffer, 0, true)

  console.dir({ semaphore })

  new Worker(__filename, { workerData: buffer })
  new Worker(__filename, { workerData: buffer })
} else {
  const { threadId, workerData } = threads
  const semaphore = new BinarySemaphore(workerData)
  const array = new Int8Array(workerData, 4)
  const value = threadId === 1 ? 1 : -1

  setTimeout(() => {
    semaphore.enter()
    for (let i = 0; i < 10; i++) {
      array[i] += value
    }
    console.dir([threadId, semaphore.lock[0], array])
    semaphore.leave()
  }, 100) // change to 10 to see race condition
}
