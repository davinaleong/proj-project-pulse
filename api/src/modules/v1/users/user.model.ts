import { z } from 'zod'

// User enums from Prisma schema
export const UserRole = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  SUPERADMIN: 'SUPERADMIN',
} as const

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  BANNED: 'BANNED',
  PENDING: 'PENDING',
} as const

export type UserRoleType = keyof typeof UserRole
export type UserStatusType = keyof typeof UserStatus

// Password validation - at least 8 chars, 1 uppercase, 1 lowercase, 1 number
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

// Validation schemas
export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  email: z.string().email('Invalid email format').toLowerCase(),
  password: z
    .string()
    .regex(
      passwordRegex,
      'Password must be at least 8 characters with uppercase, lowercase, and number',
    ),
  role: z.enum(['USER', 'ADMIN', 'MANAGER', 'SUPERADMIN']).default('USER'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BANNED', 'PENDING']).default('ACTIVE'),
})

export const updateUserSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name too long')
    .optional(),
  email: z.string().email('Invalid email format').toLowerCase().optional(),
  role: z.enum(['USER', 'ADMIN', 'MANAGER', 'SUPERADMIN']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BANNED', 'PENDING']).optional(),
  emailVerifiedAt: z.date().optional().nullable(),
  lastLoginAt: z.date().optional().nullable(),
  lastLoginIp: z.string().optional().nullable(),
  twoFactorEnabled: z.boolean().optional(),
  failedLoginAttempts: z.number().int().min(0).optional(),
  lockedUntil: z.date().optional().nullable(),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .regex(
        passwordRegex,
        'Password must be at least 8 characters with uppercase, lowercase, and number',
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export const userQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(['USER', 'ADMIN', 'MANAGER', 'SUPERADMIN']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BANNED', 'PENDING']).optional(),
  search: z.string().optional(),
  includeProfile: z.coerce.boolean().default(false),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().default(false),
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase(),
})

export const confirmResetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: z
      .string()
      .regex(
        passwordRegex,
        'Password must be at least 8 characters with uppercase, lowercase, and number',
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

// Types
export type CreateUserData = z.infer<typeof createUserSchema>
export type UpdateUserData = z.infer<typeof updateUserSchema>
export type ChangePasswordData = z.infer<typeof changePasswordSchema>
export type UserQuery = z.infer<typeof userQuerySchema>
export type LoginData = z.infer<typeof loginSchema>
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>
export type ConfirmResetPasswordData = z.infer<
  typeof confirmResetPasswordSchema
>

// Safe user type (without sensitive fields)
export interface SafeUser {
  id: number
  uuid: string
  name: string
  email: string
  emailVerifiedAt: Date | null
  role: UserRoleType
  status: UserStatusType
  lastLoginAt: Date | null
  twoFactorEnabled: boolean
  createdAt: Date
  updatedAt: Date
  profile?: {
    id: number
    bio: string | null
    avatarUrl: string | null
    timezone: string | null
    language: string | null
    theme: string
    visibility: string
  } | null
}
