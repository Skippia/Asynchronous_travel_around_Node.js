import WorkerPool from 'workerpool'
import { offloadedFunction } from '../offloaded-function'

//* Create worker (add function to worker)
WorkerPool.worker({
  offloadedFunction,
})
