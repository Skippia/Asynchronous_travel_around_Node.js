import { Worker, isMainThread, parentPort, workerData } from 'worker_threads'
import url from 'url'

const __filename = url.fileURLToPath(import.meta.url)

class AtomicCounter {
  atomics: BigInt64Array[]

  constructor(atomics: BigInt64Array[]) {
    this.atomics = atomics
  }

  add(idx: number) {
    // TODO: implement
  }
}

if (isMainThread) {
  const start = performance.now()
  const threads = 4
  const incrementer = 100_000_000
  const atomics = [
    new BigInt64Array(new SharedArrayBuffer(8)),
    new BigInt64Array(new SharedArrayBuffer(8)),
    new BigInt64Array(new SharedArrayBuffer(8)),
    new BigInt64Array(new SharedArrayBuffer(8)),
  ]

  let completedThreads = 0

  for (let i = 0; i < threads; i++) {
    const worker = new Worker(__filename, {
      workerData: { incrementer, atomics, threadNumber: i },
    })

    worker.on('message', () => {
      completedThreads++

      if (completedThreads === threads) {
        const end = performance.now()
        const atomicCounter = new AtomicCounter(atomics)

        console.log('[Time]', end - start)
      }
    })
  }
} else {
  const { incrementer, atomics, threadNumber } = workerData

  for (let i = 0; i < incrementer; i++) {
    atomics[threadNumber][0]++
  }

  parentPort.postMessage('done')
}
