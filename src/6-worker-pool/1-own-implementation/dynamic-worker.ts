import { parentPort } from 'worker_threads'

parentPort.on('message', (msg) => {
  const { id, callback, data } = msg

  const realCallback = new Function(`return ${callback}`)()

  const result = realCallback(data)

  parentPort.postMessage({ id, result })
})
