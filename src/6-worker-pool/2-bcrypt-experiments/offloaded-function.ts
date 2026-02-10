/**
 * ? Heavy function that should be offloaded in dedicated worker
 */
import { functionType, functionTypeMap } from './server'

export const bcryptFunction = (password: string) => functionTypeMap[functionType](password)
