import WorkerPool from 'workerpool'
import { bcryptFunction } from '../offloaded-function'

//* Create worker (add function to worker)
WorkerPool.worker({
  bcryptFunction,
})
