import { Worker } from 'worker_threads'
import path from 'path'
import url from 'url'
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

export function runInWorkerThreads(chunks: number[][], concurrentWorkers: number) {
  return new Promise<number>((resolve) => {
    let completedWorkers = 0
    let totalCount = 0

    chunks.forEach((chunk, i) => {
      const worker = new Worker(path.join(__dirname, './worker-thread.js'))

      worker.postMessage(chunk)

      worker.on('message', (count: number) => {
        console.log(`Worker ${i + 1} completed, count: ${count}`)
        completedWorkers++
        totalCount += count

        if (completedWorkers === concurrentWorkers) {
          resolve(totalCount)
        }
      })
    })
  })
}
