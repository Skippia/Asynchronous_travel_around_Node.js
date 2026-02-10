/**
 * ? It works much more better
 * ? but sometimes we met disproportion
 *
 * ? А причина в том, что теперь у нас снова есть критическая секция -
 * это код метода enter семафора. Получив значение флага мы не гарантируем,
 * что оно будет тем же в момент, когда мы устанавливаем его в состояние блокировки.
 * ! Самое время воспользоваться возможностями Atomics
 */

import threads from 'worker_threads'
import url from 'url'
const __filename = url.fileURLToPath(import.meta.url)

const { Worker, isMainThread } = threads
const LOCKED = 1
const UNLOCKED = 0

class BinarySemaphore {
  lock: Int8Array

  constructor(shared: SharedArrayBuffer, offset = 0) {
    this.lock = new Int8Array(shared, offset, 1)
  }

  enter() {
    while (this.lock[0] !== UNLOCKED);
    this.lock[0] = LOCKED
  }

  leave() {
    this.lock[0] = UNLOCKED
  }
}

if (isMainThread) {
  const buffer = new SharedArrayBuffer(3)

  for (let i = 0; i < 22; i++) {
    new Worker(__filename, { workerData: buffer })
  }

  setTimeout(() => {
    const array = new Int8Array(buffer, 1)
    console.log(`Делали броски: ${array[0]}`)
    console.log(`Тренировали катание: ${array[1]}`)
  }, 2000)
} else {
  const { threadId, workerData } = threads
  const semaphore = new BinarySemaphore(workerData)
  const array = new Int8Array(workerData, 1)

  semaphore.enter()
  const [doKicks, doSkating] = array

  console.log(`На лед выходит ${threadId}.`)

  if (doKicks === doSkating) {
    array[1]++
  } else {
    array[0]++
  }

  semaphore.leave()
}
