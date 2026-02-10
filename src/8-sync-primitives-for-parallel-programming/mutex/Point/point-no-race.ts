import threads from 'worker_threads'
const { Worker, isMainThread } = threads
import url from 'url'
import { Point } from './Point'
import { Mutex } from '../Mutex/Mutex-2'
const __filename = url.fileURLToPath(import.meta.url)

if (isMainThread) {
  //* 12 bytes
  const buffer = new SharedArrayBuffer(12)
  const mutex = new Mutex(buffer, 0, true)

  /**
   * * Do shift 4 byte, because first 4 bytes are reserved for lock variable
   * * Takes 8 bytes - stores point coordinatees
   */
  const array = new Int32Array(buffer, 4, 2)
  const point = new Point(array, 0, 0)

  console.dir({ mutex, point })
  new Worker(__filename, { workerData: buffer })
  new Worker(__filename, { workerData: buffer })
} else {
  const { threadId, workerData } = threads

  //* Mutex equals 1 means that it's unlocked
  const mutex = new Mutex(workerData)
  /**
   * * Do shift 4 byte, because first 4 bytes are reserved for lock variable
   */
  const array = new Int32Array(workerData, 4, 2)
  const point = new Point(array)

  if (threadId === 1) {
    for (let i = 0; i < 1000000; i++) {
      mutex.enter()
      point.move(1, 1)
      mutex.leave()
    }

    mutex.enter()
    console.dir({ point })
    mutex.leave()
  } else {
    for (let i = 0; i < 1000000; i++) {
      mutex.enter()
      point.move(-1, -1)
      mutex.leave()
    }

    mutex.enter()
    console.dir({ point })
    mutex.leave()
  }
}
