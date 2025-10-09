// Shared types for the API

export type ApiResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string | null
}

export type Pagination = {
  page: number
  perPage: number
  total?: number
}

export {}
