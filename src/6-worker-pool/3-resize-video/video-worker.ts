import { parentPort } from 'worker_threads'
import ffmpeg from 'fluent-ffmpeg'
import url from 'url'
import path from 'path'
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

const resizeVideo = (src, size) => {
  const [filename, ext] = src.split('.')
  const output = path.join(__dirname, `./${filename}-${size}.${ext}`)

  ffmpeg(path.join(__dirname, src))
    .size(size)
    .on('error', function (err) {
      console.log('An error occurred: ' + err.message)
    })
    .on('end', function () {
      console.log('Processing finished !')
      parentPort.postMessage({
        output,
        input: src,
        type: 'done',
      })
    })
    .save(output)
}

parentPort.on('message', (msg) => {
  const { file, size } = msg
  resizeVideo(file, size)
})
