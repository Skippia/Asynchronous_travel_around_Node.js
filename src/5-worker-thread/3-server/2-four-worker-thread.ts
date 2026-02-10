import { workerData, parentPort } from 'worker_threads'

let counter = 0
for (let i = 0; i < 20_000_000_000 / workerData.thread_count; i++) {
  counter++
}

parentPort.postMessage(counter)
