import axios from 'axios'
import { dummyApiUrls } from './helpers'

/**
 * We start to execute promises one after another
 * and return result upon completion of
 * ----------------------------------------------------
 * Source: https://www.youtube.com/watch?v=vC6G7CZPCuY
 */
/**
 * ? It takes ~ 10s s
 */
export async function runSequentialPromises() {
  const id = MeasurePerformance.start()

  const resultData: unknown[] = []

  for (const dummyApiUrl of dummyApiUrls) {
    const data = await axios.get(dummyApiUrl)
    resultData.push(data)
  }

  console.log('[Sequential promises]: Result data length', resultData.length)

  MeasurePerformance.end(id)
}
