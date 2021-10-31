


class Cancel{
  constructor(message) {
    this.message = message
    this.__CANCEL__ = true
  }

  toString() {
    if (this.message) {
      return `Cancel : ${this.message}`
    }
    return `Cancel`
  }
}

export default Cancel