/**
 * In order to achieve real parallel execution, we need
 * run each promise in (f.e) worker thread.
 * But there is no sense in it, since it's not CPU-bound task
 * ----------------------------------------------------
 * Source: https://www.youtube.com/watch?v=vC6G7CZPCuY
 */
export async function runParallelPromises() {
  const id = MeasurePerformance.start()
  // ...
  MeasurePerformance.end(id)
}
