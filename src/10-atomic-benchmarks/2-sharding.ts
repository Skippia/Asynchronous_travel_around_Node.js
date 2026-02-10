import { Worker, isMainThread, parentPort, workerData } from 'worker_threads'
import url from 'url'

const __filename = url.fileURLToPath(import.meta.url)

if (isMainThread) {
  const start = performance.now()
  const threads = 15
  const incrementer = 100_000_000
  const buffers = new Array(threads)
    .fill('*')
    .map(() => new SharedArrayBuffer(Uint32Array.BYTES_PER_ELEMENT))

  let completedThreads = 0

  for (let i = 0; i < threads; i++) {
    const worker = new Worker(__filename, {
      workerData: { incrementer, buffers, threadNumber: i },
    })

    worker.on('message', () => {
      completedThreads++

      if (completedThreads === threads) {
        const end = performance.now()

        console.log('[Time]', end - start)
        console.log(
          'result',
          buffers.map((a) => new Uint32Array(a)),
        )
      }
    })
  }
} else {
  const { incrementer, buffers, threadNumber } = workerData
  const atomics = new Uint32Array(buffers[threadNumber])

  for (let j = 0; j < incrementer; j++) {
    Atomics.add(atomics, 0, 1)
  }

  parentPort.postMessage(atomics)
}
