export function task(n: number): number {
  const fibonacci = (n) => (n < 2 ? n : fibonacci(n - 2) + fibonacci(n - 1))

  return fibonacci(n)
}
