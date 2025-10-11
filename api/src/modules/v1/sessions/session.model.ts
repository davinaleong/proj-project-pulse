import { z } from 'zod'

// Session query schema
export const sessionQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val > 0, 'Page must be a positive number'),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  sortBy: z
    .enum(['lastActiveAt', 'createdAt', 'userAgent', 'ipAddress'])
    .optional()
    .default('lastActiveAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  active: z
    .string()
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined
      return val === 'true'
    }),
})

// Session revocation schema
export const revokeSessionSchema = z.object({
  sessionId: z.number().int().positive('Session ID must be a positive integer'),
})

export const revokeAllSessionsSchema = z.object({
  excludeCurrent: z.boolean().optional().default(true),
})

// Type definitions
export type SessionQueryParams = z.infer<typeof sessionQuerySchema>
export type RevokeSessionRequest = z.infer<typeof revokeSessionSchema>
export type RevokeAllSessionsRequest = z.infer<typeof revokeAllSessionsSchema>

// Session DTOs
export interface SessionDto {
  id: number
  userId: number
  userAgent: string | null
  ipAddress: string | null
  lastActiveAt: Date | null
  revokedAt: Date | null
  isActive: boolean
  createdAt: Date
}

export interface SessionWithUserDto extends SessionDto {
  user: {
    id: number
    uuid: string
    name: string
    email: string
    role: string
  }
}

export interface SessionListResponse {
  sessions: SessionDto[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface SessionStatsDto {
  totalSessions: number
  activeSessions: number
  revokedSessions: number
  uniqueDevices: number
  uniqueIpAddresses: number
  lastActivity: Date | null
}

// Session filters
export interface SessionFilters {
  userId?: number
  active?: boolean
  ipAddress?: string
  userAgent?: string
  createdAfter?: Date
  createdBefore?: Date
  lastActiveAfter?: Date
  lastActiveBefore?: Date
}

// Session activity tracking
export interface SessionActivity {
  sessionId: number
  action: string
  timestamp: Date
  details?: Record<string, unknown>
}

// Session security alert types
export interface SecurityAlert {
  type: 'NEW_DEVICE' | 'SUSPICIOUS_LOCATION' | 'CONCURRENT_SESSIONS'
  sessionId: number
  userId: number
  details: {
    userAgent?: string
    ipAddress?: string
    location?: string
    deviceInfo?: string
  }
  timestamp: Date
}

// Session device information
export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet' | 'unknown'
  browser: string
  os: string
  isBot: boolean
}

// Bulk session operations
export const bulkRevokeSessionsSchema = z.object({
  sessionIds: z
    .array(z.number().int().positive())
    .min(1, 'At least one session ID is required')
    .max(50, 'Cannot revoke more than 50 sessions at once'),
})

export type BulkRevokeSessionsRequest = z.infer<typeof bulkRevokeSessionsSchema>

export interface BulkOperationResult {
  success: number
  failed: number
  errors: Array<{
    sessionId: number
    error: string
  }>
}

// Session analytics
export interface SessionAnalytics {
  totalSessions: number
  activeSessions: number
  sessionsToday: number
  sessionsThisWeek: number
  sessionsThisMonth: number
  averageSessionDuration: number
  topDevices: Array<{
    device: string
    count: number
  }>
  topLocations: Array<{
    location: string
    count: number
  }>
  hourlyActivity: Array<{
    hour: number
    count: number
  }>
}
