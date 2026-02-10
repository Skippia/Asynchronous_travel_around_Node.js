import axios from 'axios'
import { dummyApiUrls } from './helpers'

/**
 * We start to execute promises immediately
 * and when both of them are completed - return result
 * ----------------------------------------------------
 * (another words we kinda register them "in parallel mode", but
 * they are executed in main thread as usual promises)
 * ----------------------------------------------------
 * Source: https://www.youtube.com/watch?v=vC6G7CZPCuY
 */
/**
 * ? It takes ~ 1.2 s
 */
export async function runConcurrentPromises() {
  const id = MeasurePerformance.start()

  const resultData = await Promise.all(dummyApiUrls.map((dummyApiUrl) => axios.get(dummyApiUrl)))

  console.log('[Concurrent promises]: Result data length', resultData.length)

  MeasurePerformance.end(id)
}
