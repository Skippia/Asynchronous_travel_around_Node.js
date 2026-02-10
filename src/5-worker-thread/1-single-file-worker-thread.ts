import path from 'path'
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads'
import url from 'url'
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

if (isMainThread) {
  const worker = new Worker(path.join(__dirname, './1-single-file-worker-thread.js'), {
    workerData: 'hello',
  })
  worker.on('message', (msg) => console.log(`Worker message received: ${msg}`))
  worker.on('error', (err) => console.error(err))
  worker.on('exit', (code) => console.log(`Worker exited with code ${code}.`))
} else {
  const data = workerData
  parentPort.postMessage(`You said "${data}`)
}
