class MeasurePerformance {
  private static queue: Map<string, number> = new Map<string, number>()

  public static start(id?: string): string {
    const start = performance.now()
    const _id = id ? id : String(start)

    this.queue.set(_id, start)

    return _id
  }

  public static end(id: string, defaultConsole = true): string {
    const end = performance.now()

    const start = this.queue.get(id)
    this.queue.delete(id)

    const duration = `Duration: ${((end - start) / 1000).toFixed(2)} s `

    if (defaultConsole) {
      console.log(duration)
    }

    return duration
  }
}

type TMeasurePerformance = typeof MeasurePerformance

export { type TMeasurePerformance, MeasurePerformance }
