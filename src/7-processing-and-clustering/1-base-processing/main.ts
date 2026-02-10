import { fork } from 'child_process'
import url from 'url'
import path from 'path'
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

const child = fork(path.join(__dirname, './child.js'))

child.send(20)

child.on('message', (message: number) => {
  console.log('Result: ', message)
})
