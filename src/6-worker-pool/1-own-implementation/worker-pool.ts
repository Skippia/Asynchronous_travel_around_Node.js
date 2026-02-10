/* eslint-disable @typescript-eslint/no-explicit-any */
import { Task, TaskItem, WorkerPool, WorkerPoolOptions } from './worker.types'
import { Worker } from 'worker_threads'
import url from 'url'
import path from 'path'
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

/**
 * ? During creating workerpool:
 *  ? 1. Create idle wokerrs, resolvers, backlog
 *  ? 2. Set listeners (on('message')) for each worker to pick up results
 * ? ----------------------------------------------------------------------------
 * ? pool.createTask(cb).runAsync(incArgs) - run callback in worker thread
 *  ? 1.
 */
export function createWorkerpool(options: WorkerPoolOptions): WorkerPool {
  // ? { threadId: Worker}
  const workers = new Map(
    Array.from({ length: options.workers }).map<[number, Worker]>(() => {
      const w = new Worker(path.join(__dirname, './dynamic-worker.js'))
      return [w.threadId, w]
    })
  )

  //*? threadId[]
  const idle = Array.from(workers.keys())
  // ? { threadId: callback }
  const resolvers = new Map<number, (data: any) => any>()
  // ? { id: number, task: callback, data: any }[]
  const backlog: TaskItem<any>[] = []

  //? Amount of tasks in workerpool (?)
  let taskIdCounter = 0
  let terminating = false

  const runNext = () => {
    if (terminating) return
    if (backlog.length == 0 || idle.length == 0) return

    /**
     * ? Dequeue task from backlog
     * ? Dequeue idle worker from idle
     */
    const task = backlog.shift()
    const worker = idle.shift()

    console.log(`scheduling ${task.id} on idle ${worker}  `)

    // ? Convert callback function to string in order to use within `eval`
    const msg = {
      id: task.id,
      callback: task.callback.toString(),
      data: task.data,
    }

    // ? Send message to target worket (run it)
    workers.get(worker).postMessage(msg)
    runNext()
  }
  /**
   * ? Set listeners for each work - to listen message (respond from worker)
   */
  workers.forEach((worker, i) => {
    worker.on('message', (data) => {
      const { id, result } = data

      /**
       *  ? Get result from worker - need to mark the task as resolved:
       * 	 ? 1. Manually to resolve the promise
       * 	 ? 2. Delete resolver from resolvers map
       *   ? 3. Since worker thread has completed its task, we should mark it as idle
       */
      resolvers.get(Number(id))(result)
      resolvers.delete(id)
      idle.push(i)
      runNext()
    })
  })

  return {
    createTask<data, result>(callback): Task<data, result> {
      return {
        /**
         * ? We will get the result of this promise when
         * ? in resolvers map we call assossiated resolve callback
         * ? : resolvers.get(id)(result)
         */
        runAsync(data: data): Promise<result> {
          if (terminating) return Promise.reject(new Error('Workerpool is terminating'))

          // ? Increase amount of tasks in workerpool
          taskIdCounter += 1
          // ? Register task in workepool (add unique id, her callback, and input arguments for this callback)
          backlog.push({
            id: taskIdCounter,
            callback,
            data,
          })

          const p = new Promise<result>((resolve) => resolvers.set(taskIdCounter, resolve))
          runNext()
          return p
        },
        map2<result2>(f: (r: result) => result2): Task<data, result2> {
          return {
            ...this,
            runAsync: () => this.runAsync().then(f),
          }
        },
        then2<result2>(t: Task<result, result2>): Task<data, result2> {
          return {
            ...this,
            runAsync: (d) => this.runAsync(d).then((a) => t.runAsync(a)),
          }
        },
      }
    },
    async terminate() {
      terminating = true
      await new Promise((r) => {
        setInterval(() => (idle.length == workers.size ? (r as any)() : null), 10)
      })
      console.log('all workers empty')
      await Promise.all(Array.from(workers.values()).map((v) => v.terminate()))
    },
  }
}
