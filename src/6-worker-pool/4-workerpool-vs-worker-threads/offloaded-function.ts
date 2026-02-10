export function offloadedFunction(jobs: number[]) {
  let count = 0

  for (const job of jobs) {
    for (let i = 0; i < job; i++) {
      count++
    }
  }

  return count
}
