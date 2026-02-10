/* eslint-disable no-unused-vars */
export interface Task<data, result> {
  runAsync(data: data): Promise<result>
  map2<result2>(f: (o: result) => result2): Task<data, result2>
  then2<result2>(f: Task<result, result2>): Task<data, result2>
}

export interface WorkerPool {
  createTask<data, result>(f: (d: data) => result): Task<data, result>
  terminate(): Promise<void>
}

export interface WorkerPoolOptions {
  workers: number
}

export type TaskItem<T> = {
  id: number
  callback: (data: T) => void
  data: T
}
