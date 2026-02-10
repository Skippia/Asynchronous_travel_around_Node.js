/**
 * ! По условию в обеих командах может быть только по 11 человек
 */
/**
 * ? Semaphore позволяет выполнять код (колбэк) внутри критической секции
 */

import threads from 'worker_threads'
import url from 'url'
const __filename = url.fileURLToPath(import.meta.url)

const { Worker, isMainThread } = threads

const LOCKED = 1
const UNLOCKED = 0

class BinarySemaphore {
  /**
   * ! It should be Int32Array element, because Atomics.wait doesn't suppoert another data type
   */
  lock: Int32Array

  constructor(shared: SharedArrayBuffer, offset = 0) {
    this.lock = new Int32Array(shared, offset, 1)
  }

  enter() {
    while (true) {
      /**
       * ? Если по какой-то причине current_state is unlocked,
       * ? то меняем на locked и выходим их цикла
       */
      if (Atomics.compareExchange(this.lock, 0, UNLOCKED, LOCKED) === UNLOCKED) {
        return
      }
      /**
       * ? Если current_state is locked, то замораживаем поток до тех пор,
       * ? пока current_state не станет равным unlocked
       */
      Atomics.wait(this.lock, 0, LOCKED)
    }
  }

  leave() {
    /**
     * ?  Если current_state is locked, то меняем на unlocked. И уведомляем об этом второй поток
     * ? Иначе бросаем ошибку
     */
    if (Atomics.compareExchange(this.lock, 0, LOCKED, UNLOCKED) !== LOCKED) {
      throw new Error('Cannot leave unlocked BinarySemaphore')
    }
    Atomics.notify(this.lock, 0, 1)
  }

  exec(callback) {
    this.enter()
    try {
      return callback()
    } finally {
      this.leave()
    }
  }
}

if (isMainThread) {
  const buffer = new SharedArrayBuffer(6)

  for (let i = 0; i < 22; i++) {
    new Worker(__filename, { workerData: buffer })
  }

  setTimeout(() => {
    const array = new Int8Array(buffer, 4)
    console.log(`Делали броски: ${array[0]}`)
    console.log(`Тренировали катание: ${array[1]}`)
  }, 1000)
} else {
  const { threadId, workerData } = threads
  const semaphore = new BinarySemaphore(workerData)
  const array = new Int8Array(workerData, 4)

  semaphore.exec(() => {
    const [doKicks, doSkating] = array

    console.log(`На лед выходит ${threadId}.`)

    if (doKicks === doSkating) {
      array[1]++
    } else {
      array[0]++
    }
  })
}
