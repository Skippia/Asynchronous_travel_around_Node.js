/**
 * ! Please copy video manually to build folder in relative path
 */
import { StaticPool } from 'node-worker-threads-pool'
import path from 'path'
import url from 'url'
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

export async function resizeVideo() {
  const pool = new StaticPool({
    // ? It doesn't matter how many worker threads in our workpool because
    // ? we offload our heavy operation in the single worker thread
    size: 1,
    task: path.join(__dirname, './video-worker.js'),
  })

  const videoToResize = 'video.mp4'
  const videoTargetSize = '1280x720'

  const resize = async () => {
    const timerId = MeasurePerformance.start()

    await pool.exec({ file: videoToResize, size: videoTargetSize }).then((msg) => {
      if (msg?.type === 'done') {
        console.log(`Saved ${videoToResize} to ${msg.output}`)
        MeasurePerformance.end(timerId)

        // Manually exit from the program
        process.exit(0)
      }
    })
  }

  resize()
}
