import { TPoolProxy } from '../../2-bcrypt-experiments/worker-pool/controller'

export async function runInWorkerpool({
  workerPoolProxy,
  chunks,
  concurrentWorkers,
}: {
  workerPoolProxy: TPoolProxy
  chunks: number[][]
  concurrentWorkers: number
}) {
  const workerPromises = []

  for (let i = 0; i < concurrentWorkers; i++) {
    workerPromises.push(workerPoolProxy.offloadedFunction(chunks[i]))
  }

  const workerPromisesResults: number[] = await Promise.all(workerPromises)

  return workerPromisesResults.reduce((acc, cur) => acc + cur, 0)
}
