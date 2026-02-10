import WorkerPool from 'workerpool'

export type TPoolProxy = Awaited<ReturnType<WorkerPool.WorkerPool['proxy']>>

export let poolProxy: TPoolProxy

async function initWorkerPool(
  pathToWorkerAbsolute: string,
  options?: WorkerPool.WorkerPoolOptions
) {
  /**
   * ? as first arg for WorkerPool.pool we set path to script
   * ? that collects dedicated workers and add them to workerpool
   */
  const pool = WorkerPool.pool(pathToWorkerAbsolute, options)

  poolProxy = await pool.proxy()
  console.log(
    //@ts-expect-error 123
    `Worker Threads Enabled - Min Workers: ${pool.minWorkers} - Max Workers: ${pool.maxWorkers} - Worker Type: ${pool.workerType}`
  )
}

const getWorkerPoolProxy = () => poolProxy

export { initWorkerPool, getWorkerPoolProxy }
