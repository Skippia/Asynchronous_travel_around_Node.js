/**
 * ! Original implementation from Timur S
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

  enter() {
    /**
     * ? current_state becomes locked
     */
    let prev = Atomics.exchange(this.lock, 0, LOCKED)
    /**
     * ? If current_state is locked, we will be frozen
     */
    while (prev !== UNLOCKED) {
      /**
       * ? Froze thread until current_state is unlocked
       */
      Atomics.wait(this.lock, 0, LOCKED)
      /**
       * ? We are here only if another thread leave from mutex
       * ? => we are come in => lock Mutex and become ownership
       */
      prev = Atomics.exchange(this.lock, 0, LOCKED)
    }
    this.owner = true
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
