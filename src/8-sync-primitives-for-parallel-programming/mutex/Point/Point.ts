export class Point {
  data: Int32Array

  constructor(data: Int32Array, x?: number, y?: number) {
    this.data = data
    if (x) data[0] = x
    if (y) data[1] = y
  }

  get x() {
    return this.data[0]
  }
  set x(value) {
    this.data[0] = value
  }

  get y() {
    return this.data[1]
  }
  set y(value) {
    this.data[1] = value
  }

  move(x: number, y: number) {
    this.x += x
    this.y += y
  }
}
