export default class Response<T> {
  public code: number
  public payload: T

  static ok<U>(payload: U): Response<U> {
    return new Response(0, payload)
  }

  static err<U>(payload: U, code: number = 1): Response<U> {
    return new Response(code, payload)
  }

  constructor(code: number, payload: T) {
    this.code = code
    this.payload = payload
  }
}