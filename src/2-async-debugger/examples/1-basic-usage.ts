import async_hooks from 'async_hooks'
import fs from 'fs'

export function basicUsage() {
  async_hooks
    .createHook({
      init(asyncId, type, triggerAsyncId) {
        const id = async_hooks.executionAsyncId()
        fs.writeSync(1, `- ${type}(${asyncId}): trigger: ${triggerAsyncId} execution: ${id}\n`)
      },
    })
    .enable()

  setTimeout(() => {}, 10)
}
