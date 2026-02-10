import WorkerPool from 'workerpool'

function calcAtomic(incrementer: number, buffer: SharedArrayBuffer, threadNumber: number) {
  const atomics = new Int32Array(buffer)

  for (let i = 0; i < incrementer; i++) {
    atomics[threadNumber]++
  }

  return buffer
}

WorkerPool.worker({
  calcAtomic,
})
