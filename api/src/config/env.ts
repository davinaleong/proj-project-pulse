// src/config/env.ts
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

const rootDir = path.resolve(__dirname, '../../')

// Choose .env file based on NODE_ENV (test -> .env.test, development -> .env.local)
function resolveEnvFile(): string {
  if (process.env.NODE_ENV === 'test') return '.env.test'
  if (process.env.NODE_ENV === 'development') return '.env.local'
  return '.env'
}

const envFile = resolveEnvFile()
const envPath = path.join(rootDir, envFile)

if (fs.existsSync(envPath)) {
  console.log(`Loading environment variables from ${envFile}`)
  dotenv.config({ path: envPath })
} else {
  console.warn(
    `Environment file ${envFile} not found. Falling back to process.env`,
  )
}

function requiredEnv(name: string): string {
  const v = process.env[name]
  if (!v || v.trim() === '') {
    throw new Error(
      `Environment variable ${name} is required but was not provided`,
    )
  }
  return v
}

export type Env = {
  NODE_ENV: 'development' | 'test' | 'production'
  PORT: number
  DATABASE_URL: string
  JWT_SECRET: string
  LOG_LEVEL?: string
}

export const ENV: Env = {
  NODE_ENV: (process.env.NODE_ENV as Env['NODE_ENV']) || 'development',
  PORT: Number(process.env.PORT ?? 3000),
  DATABASE_URL: requiredEnv('DATABASE_URL'),
  JWT_SECRET: requiredEnv('JWT_SECRET'),
  LOG_LEVEL: process.env.LOG_LEVEL,
}

export const isDev = ENV.NODE_ENV === 'development'
export const isTest = ENV.NODE_ENV === 'test'
export const isProd = ENV.NODE_ENV === 'production'

export default ENV
