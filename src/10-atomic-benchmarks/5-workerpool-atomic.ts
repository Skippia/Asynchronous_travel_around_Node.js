import WorkerPool from 'workerpool'
import path from 'path'
import url from 'url'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

async function run() {
  const threads = 4
  const incrementer = 100_000_000

  const sharedArrayBuffer = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT)
  const atomics = new Int32Array(sharedArrayBuffer)

  const pool = WorkerPool.pool(path.join(__dirname, './workers/atomic-worker.js'), {
    minWorkers: threads,
    maxWorkers: threads,
    workerType: 'thread',
  })

  const promises = []

  for (let i = 0; i < threads; i++) {
    promises.push(pool.exec('calcAtomic', [incrementer, sharedArrayBuffer]))
  }

  const start = performance.now()
  Promise.all(promises)
    .then(function (results) {
      console.log('results', results)
      console.log('atomics', atomics)
    })
    .catch(function (err) {
      console.error(err)
    })
    .then(function () {
      pool.terminate()
      const end = performance.now()
      console.log('Time taken:', end - start)
    })
}

run()
