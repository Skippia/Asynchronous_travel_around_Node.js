export function chunkify(array: number[], n: number) {
  const chunks: number[][] = []

  for (let i = n; i > 0; i--) {
    // 100 / 4, 75 / 3 , 50 / 2 , 25 / 1
    const chunk = array.splice(0, Math.ceil(array.length / i))
    chunks.push(chunk)
  }

  return chunks
}
