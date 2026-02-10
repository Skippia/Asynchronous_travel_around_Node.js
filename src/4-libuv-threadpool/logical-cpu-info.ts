import os from 'os'

export function logicalCpuInfo() {
  console.log(`Logical Count = ${os.cpus().length}`)
  console.log(`Logical core info:`, os.cpus())
}
