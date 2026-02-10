export function calculateCountSync() {
  let counter = 0
  for (let i = 0; i < 20_000_000_000; i++) {
    counter++
  }

  return counter
}

/**
 * ? Despite the fact that it's async function - as we know:
 * ! CPU-bound operation doesn't use libuv threads, unlike of IO-bound tasks
 * ? => it blocks EL
 */
export function calculateCountAsync() {
  return new Promise((resolve) => {
    let counter = 0
    for (let i = 0; i < 20_000_000_000; i++) {
      counter++
    }
    resolve(counter)
  })
}
