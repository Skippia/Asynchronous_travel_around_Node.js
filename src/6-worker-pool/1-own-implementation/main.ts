import { task } from './offloaded-function'
import { createWorkerpool } from './worker-pool'

export async function runOwnImplWorkerpool() {
  const pool = createWorkerpool({ workers: 5 })

  const result = await pool
    .createTask(task)
    .then2(pool.createTask((res) => res * 2)) // 2 - planned as
    .then2(pool.createTask((res) => 'res is: ' + res.toString())) // 3 - planned as
    .runAsync(30) // 1 - planned as

  console.log(result)
}
