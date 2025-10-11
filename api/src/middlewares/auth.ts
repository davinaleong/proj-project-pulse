import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { UserService } from '../modules/v1/users/user.service'

interface JwtPayload {
  uuid: string
  email: string
  role: string
}

const userService = new UserService()

// Basic authentication middleware
export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      })
    }

    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key'
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload

    const user = await userService.getUserByUuid(decoded.uuid)

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.',
      })
    }

    if (user.status !== 'ACTIVE') {
      return res.status(401).json({
        success: false,
        message: 'Account is not active.',
      })
    }

    req.user = user
    next()
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
    })
  }
}

// Admin only middleware
export const adminOnly = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    })
  }

  if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPERADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required.',
    })
  }

  next()
}

// Manager or Admin middleware
export const managerOrAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    })
  }

  const allowedRoles = ['MANAGER', 'ADMIN', 'SUPERADMIN']
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Manager or Admin access required.',
    })
  }

  next()
}

// Super admin only middleware
export const superAdminOnly = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    })
  }

  if (req.user.role !== 'SUPERADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Super Admin access required.',
    })
  }

  next()
}

// Check if user owns resource or has admin privileges
export const ownerOrAdmin = (
  getResourceUserId?: (req: Request) => Promise<string | null>,
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      })
    }

    // Admin can access anything
    if (req.user.role === 'ADMIN' || req.user.role === 'SUPERADMIN') {
      return next()
    }

    // Check ownership if function provided
    if (getResourceUserId) {
      try {
        const resourceUserId = await getResourceUserId(req)
        if (resourceUserId === req.user.uuid) {
          return next()
        }
      } catch {
        return res.status(500).json({
          success: false,
          message: 'Error checking resource ownership.',
        })
      }
    }

    // Check if accessing own resources via URL parameter
    const { uuid } = req.params
    if (uuid === req.user.uuid) {
      return next()
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own resources.',
    })
  }
}
