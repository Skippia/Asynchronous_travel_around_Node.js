import { Worker } from 'worker_threads'
import url from 'url'
import path from 'path'
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

export function resizeImage() {
  const src = 'image.jpg'

  const sizes = [{ width: 1920 }, { width: 1280 }, { width: 640 }]

  for (const size of sizes) {
    const timerId = MeasurePerformance.start()
    const worker = new Worker(path.join(__dirname, './resize-worker.js'), {
      workerData: {
        src,
        ...size,
      },
    })
    worker.on('message', (msg) => {
      console.log(`Worker message received: ${msg}`)
      MeasurePerformance.end(timerId)
    })
    worker.on('error', (err) => console.error(err))
  }
}
