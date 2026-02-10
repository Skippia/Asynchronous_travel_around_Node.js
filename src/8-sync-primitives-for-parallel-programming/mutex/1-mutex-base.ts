/**
 * ? Mutex в отличии от семафора более безопасный.
 * ? Поскольку только тот Mutex, который заблокировал процесс, может его и разблокировать
 */

import threads from 'worker_threads'
import url from 'url'
import { Mutex } from './Mutex/Mutex-2'
const __filename = url.fileURLToPath(import.meta.url)

const { Worker, isMainThread } = threads

if (isMainThread) {
  const buffer = new SharedArrayBuffer(4)
  const mutex = new Mutex(buffer, 0, true)

  console.dir({ mutex })

  new Worker(__filename, { workerData: buffer })
  new Worker(__filename, { workerData: buffer })
} else {
  const { threadId, workerData } = threads
  const mutex = new Mutex(workerData)

  if (threadId === 1) {
    mutex.enter()

    console.log('Entered mutex')

    setTimeout(() => {
      if (mutex.leave()) {
        console.log('Left mutex')
      }
    }, 100)
  } else if (!mutex.leave()) {
    console.log('Can not leave mutex: not owner')
  }
}
