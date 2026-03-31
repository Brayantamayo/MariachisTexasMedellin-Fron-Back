
export class AppError extends Error {
public readonly status: number

constructor(message: string, status: number = 400) {
super(message)
this.name    = 'AppError'
this.status  = status


Object.setPrototypeOf(this, AppError.prototype)
  }
}