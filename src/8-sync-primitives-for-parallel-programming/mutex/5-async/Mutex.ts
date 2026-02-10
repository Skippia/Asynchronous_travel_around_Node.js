import threads from 'worker_threads'

const LOCKED = 0
const UNLOCKED = 1

export class Mutex {
  lock: Int32Array
  port: threads.MessagePort | null
  owner: boolean
  trying: boolean
  resolve: ((value?: unknown) => void) | null

  constructor(
    messagePort: threads.MessagePort | null,
    shared: SharedArrayBuffer,
    offset = 0,
    initial = false
  ) {
    this.port = messagePort
    this.lock = new Int32Array(shared, offset, 1)

    if (initial) Atomics.store(this.lock, 0, UNLOCKED)

    this.owner = false
    this.trying = false
    this.resolve = null
    if (messagePort) {
      messagePort.on('message', (kind) => {
        if (kind === 'leave' && this.trying) this.tryEnter()
      })
    }
  }

  enter() {
    return new Promise<void>((resolve) => {
      this.resolve = resolve as (value: unknown) => void
      this.trying = true
      this.tryEnter()
    })
  }

  tryEnter() {
    if (!this.resolve) return
    const prev = Atomics.exchange(this.lock, 0, LOCKED)
    if (prev === UNLOCKED) {
      this.owner = true
      this.trying = false
      this.resolve()
      this.resolve = null
    }
  }

  leave() {
    if (!this.owner) return
    Atomics.store(this.lock, 0, UNLOCKED)
    this.port.postMessage('leave')
    this.owner = false
  }
}
