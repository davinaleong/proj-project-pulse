declare global {
  namespace Express {
    interface Locals {
      requestId?: string
      // add any other shared locals here
    }

    interface Request {
      // populated by authentication middleware when available
      user?: {
        id: number
        uuid?: string
        email?: string
        role?: string
      }
    }
  }
}

export {}
