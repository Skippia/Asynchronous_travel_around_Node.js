import threads from 'worker_threads'
import url from 'url'
import { Point } from './Point'
const __filename = url.fileURLToPath(import.meta.url)

const { Worker, isMainThread } = threads

if (isMainThread) {
  const buffer = new SharedArrayBuffer(8)

  new Worker(__filename, { workerData: buffer })
  new Worker(__filename, { workerData: buffer })
} else {
  const { threadId, workerData } = threads
  const array = new Int32Array(workerData, 0, 2)
  const point = new Point(array)

  if (threadId === 1) {
    for (let i = 0; i < 1000000; i++) {
      point.move(1, 1)
    }
  } else {
    for (let i = 0; i < 1000000; i++) {
      point.move(-1, -1)
    }
  }
  console.dir({ point })
}
