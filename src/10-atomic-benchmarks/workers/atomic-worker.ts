import WorkerPool from 'workerpool'

function calcAtomic(incrementer: number, buffer: SharedArrayBuffer) {
  const atomics = new Int32Array(buffer)

  for (let i = 0; i < incrementer; i++) {
    Atomics.add(atomics, 0, 1)
  }

  return buffer
}

WorkerPool.worker({
  calcAtomic,
})
