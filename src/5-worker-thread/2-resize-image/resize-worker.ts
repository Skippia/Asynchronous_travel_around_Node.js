import { parentPort, workerData } from 'worker_threads'
import sharp from 'sharp'
import fs from 'fs'
import url from 'url'
import path from 'path'
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

const { src, width, height } = workerData
const [_, ext] = src.split('.')

const resize = async () => {
  const fileNamePath = path.join(__dirname, `./${src}-${width}.${ext}`)

  await sharp(fs.readFileSync(path.join(__dirname, `./${src}`)))
    .resize(width, height, { fit: 'cover' })
    .toFile(fileNamePath)

  parentPort.postMessage(`The file was resized to${fileNamePath}`)
}

resize()
