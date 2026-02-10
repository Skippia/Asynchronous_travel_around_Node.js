import fs from 'fs'
import { AsyncDebugger } from '../lib/async-debugger'

export function ioOperations() {
  const asyncDebugger = new AsyncDebugger()
  const tempFile = new URL('../../../file.txt', import.meta.url)

  // TEST FUNCTIONS
  const testReadFile = () => {
    fs.readFile(tempFile, () => {})
  }

  // ASYNC TRACKER
  asyncDebugger.startTracking('Test', testReadFile)
}
