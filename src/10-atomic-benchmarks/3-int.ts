import { Worker, isMainThread, parentPort, workerData } from 'worker_threads'
import url from 'url'

const __filename = url.fileURLToPath(import.meta.url)

if (isMainThread) {
  const start = performance.now()

  const threads = 15
  const incrementer = 100_000_000
  const sharedArrayBuffer = new SharedArrayBuffer(threads * Int32Array.BYTES_PER_ELEMENT)
  const atomics = new Int32Array(sharedArrayBuffer)

  let completedThreads = 0

  for (let i = 0; i < threads; i++) {
    const worker = new Worker(__filename, {
      workerData: { incrementer, threadNumber: i, buffer: sharedArrayBuffer },
    })

    worker.on('message', () => {
      completedThreads++

      if (completedThreads === threads) {
        const end = performance.now()

        console.log('Atomics', atomics)
        console.log('[Time]', end - start)
      }
    })
  }
} else {
  const { incrementer, buffer, threadNumber } = workerData
  const atomics = new Int32Array(buffer)

  for (let i = 0; i < incrementer; i++) {
    atomics[threadNumber]++
  }

  parentPort.postMessage(buffer)
}
