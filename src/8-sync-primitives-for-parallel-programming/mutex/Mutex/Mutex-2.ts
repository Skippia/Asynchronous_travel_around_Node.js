/**
 * ! This mutex is the same as ./Mutex-1.ts apart of enter method
 * ! It's my modification i'm not sure it works great, but it seems to work
 */
const LOCKED = 0
const UNLOCKED = 1

export class Mutex {
  /**
   * ! It should be Int32Array element, because Atomics.wait doesn't suppoert another data type
   */
  lock: Int32Array
  owner: boolean

  constructor(shared: SharedArrayBuffer, offset = 0, initial = false) {
    this.lock = new Int32Array(shared, offset, 1)
    if (initial) Atomics.store(this.lock, 0, UNLOCKED)
    this.owner = false
  }

  /**
   * ? We try to enter to Mutex. If it's locked, we wait (frozen) until it unlocks
   * ? ASAP we can enter to Mutex -> enter inside and set ownership
   */
  enter() {
    while (true) {
      /**
       * ? 1. First thread in queue to come in
       */
      if (Atomics.compareExchange(this.lock, 0, UNLOCKED, LOCKED) === UNLOCKED) {
        this.owner = true
        return true
      }

      /**
       * ? 2. Next thread in "queue" which should be frozen.
       * ? When another thread releases mutex, this thread move on,
       * ? get in the start of while cycle and intercepts the control of mutex
       */
      Atomics.wait(this.lock, 0, LOCKED)
    }
  }

  leave() {
    if (!this.owner) return false
    /**
     * ? If we are owner of mutex - change state of mutex to unlocked + notify
     */
    Atomics.store(this.lock, 0, UNLOCKED)
    Atomics.notify(this.lock, 0, 1)
    this.owner = false

    return true
  }
}
