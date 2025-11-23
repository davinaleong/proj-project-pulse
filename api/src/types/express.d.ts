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
        uuid: string
        email: string
        role: string
        name: string
        status: string
        emailVerifiedAt: Date | null
        lastLoginAt: Date | null
        twoFactorEnabled: boolean
        createdAt: Date
        updatedAt: Date
        profile?: unknown
      }
      // Used by activity logger to store original data before updates
      originalData?: any
    }
  }
}

export {}
