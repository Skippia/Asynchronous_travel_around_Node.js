import { defaultExpressThreadpool } from './4-libuv-threadpool/1-default-express-threadpool'
import { workerPoolRun } from './6-worker-pool/2-bcrypt-experiments/server'
import { expressWorkerThread } from './5-worker-thread/3-server/server'
import { resizeImage } from './5-worker-thread/2-resize-image/resize-main'
import { resizeVideo } from './6-worker-pool/3-resize-video/video-main'
import {
  bcryptjs_proof_async,
  bcryptjs_proof_sync,
  blocking_sync_after_io_always,
  non_blocking_async,
  non_blocking_sync_after_io_sometimes,
  non_blocking_sync_always,
  non_blocking_sync_sometimes,
} from './1-event-loop/tasks-event-loop/blocking-and-non-blocking-event-loop'
import { runOwnImplWorkerpool } from './6-worker-pool/1-own-implementation/main'

import './shared/global'
import {
  attempt_immediate_event_loop_starvation,
  attempt_unblock_event_loop,
  microtasks_setImmediate_sync1,
  microtasks_setImmediate_sync2,
  microtasks_sleep_sync5,
  microtasks_sync1,
  microtasks_sync4,
  microtasks_sync5,
  microtasks_sync6,
  microtasks_sync7,
  microtasks_sync8,
  microtasks_sync9,
  nexttick_event_loop_starvation2,
  promise_event_loop_starvation,
  sync_await1,
  sync_await2,
  timeouts_io_immediate,
} from './1-event-loop/tasks-event-loop/tasks-without-answers'
import { ioOperations } from './2-async-debugger/examples/3-io-operations'
import { workerpoolVsWorkerthreads } from './6-worker-pool/4-workerpool-vs-worker-threads/server'
import {
  runSequentialPromises,
  runConcurrentPromises,
  runParallelPromises,
} from './1-event-loop/sequential-vs-concurrent-vs-parallel'
import { promise7 } from './1-event-loop/promises/promises-unpredictable'

// runConcurrent()
// expressWorkerThread()
// bcryptjs_proof_async()
// microtasks_sync1()
// microtasks_sync7()
// sync_await2()
// defaultExpressThreadpool()
// workerPoolRun()
// expressWorkerThread()
// resizeImage()
// resizeVideo()
// resizeImage()
// resizeVideo()
// expressWorkerThread()
// workerPoolRun()`

// runOwnImplWorkerpool()

// microtasks_setImmediate_sync2()
promise7()
// workerPoolRun()
// workerpoolVsWorkerthreads({
//   mode: 'worker-threads',
//   // workerpoolMax: 12,
//   concurrentWorkers: 12,
// })

// workerPoolRun({ workersInWorkerpool: 11 })
// import './7-processing-and-clustering/2-base-clustering/cluster'
// import './7-processing-and-clustering/1-base-processing/main'
// import './8-semaphore-mutex-shared-buffer/semaphore/1-race-condition'
// import './8-primitive-parallel-sync-programming/semaphore/3-binary-semaphore-with-atomics'
// import './8-primitive-parallel-sync-programming/semaphore/4-binary-semaphore-with-atomics-2'
// import './8-primitive-parallel-sync-programming/semaphore/6-counting-semaphore-with-atomics'
// import './8-primitive-parallel-sync-programming/mutex/1-mutex'
// import './8-primitive-parallel-sync-programming/mutex/2-deadlock'
// import './8-primitive-parallel-sync-programming/mutex/3-livelock'
// import './8-primitive-parallel-sync-programming/mutex/point/point-race-condition'

// import './8-primitive-parallel-sync-programming/mutex/1-mutex-base'
// import './8-primitive-parallel-sync-programming/mutex/2-deadlock'
// import './8-primitive-parallel-sync-programming/mutex/3-livelock'
// import './8-primitive-parallel-sync-programming/mutex/point/point-race-condition'
// import './8-primitive-parallel-sync-programming/mutex/point/point-no-race'
// import './8-sync-primitives-for-parallel-programming/mutex/5-async/root'
// expressWorkerThread()
// runSequentialPromises()
// runConcurrentPromises()
// runParallelPromises()
