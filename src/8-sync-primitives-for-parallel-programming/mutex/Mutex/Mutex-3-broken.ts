/**
 * ! It's also implementation of part Mutex from Timur S, but such Mutex doesn't work
 * ! due to race condition in enter method (the rest part of mutex the same as in ./Mutex-1.ts)
 */
const LOCKED = 0
const UNLOCKED = 1

function enter() {
  /**
   * ? Froze thread until it will be unlocked
   */
  Atomics.wait(this.lock, 0, LOCKED)

  /**
   * ? We are inside - that's mean we should lock thread
   */
  Atomics.store(this.lock, 0, LOCKED)

  /**
   * ? We are inside - that's mean we are owner of this mutex
   */
  this.owner = true
}
