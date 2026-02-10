import { parentPort } from 'worker_threads'
import { offloadedFunction } from '../offloaded-function'

parentPort.on('message', (jobs: number[]) => {
  const count = offloadedFunction(jobs)

  parentPort.postMessage(count)
})
