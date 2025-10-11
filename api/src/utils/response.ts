import { Response } from 'express'

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  error?: unknown
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export const createResponse = <T = unknown>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T,
  error?: unknown,
): Response<ApiResponse<T>> => {
  const response: ApiResponse<T> = {
    success: statusCode >= 200 && statusCode < 400,
    message,
  }

  if (data !== undefined) {
    response.data = data
  }

  if (error) {
    response.error = error
  }

  return res.status(statusCode).json(response)
}

export const createSuccessResponse = <T = unknown>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = 200,
): Response<ApiResponse<T>> => {
  return createResponse(res, statusCode, message, data)
}

export const createErrorResponse = (
  res: Response,
  message: string,
  error?: unknown,
  statusCode: number = 500,
): Response<ApiResponse<unknown>> => {
  return createResponse<unknown>(res, statusCode, message, undefined, error)
}
