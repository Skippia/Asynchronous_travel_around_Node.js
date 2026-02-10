import threads from 'worker_threads'
const { Worker } = threads

export class Thread {
  worker: threads.Worker
  static workers: Set<threads.Worker>

  constructor(data: SharedArrayBuffer, workerPath: string) {
    const worker = new Worker(workerPath, { workerData: data })
    this.worker = worker

    Thread.workers.add(worker)

    worker.on('message', (kind) => {
      for (const next of Thread.workers) {
        if (next !== worker) {
          next.postMessage(kind)
        }
      }
    })
  }
}

Thread.workers = new Set()
