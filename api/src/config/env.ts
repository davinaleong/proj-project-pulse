console.log('env.ts')

// src/config/env.ts
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

const rootDir = path.resolve(__dirname, '../../')

// Priority order:
// 1. .env.test   (when NODE_ENV === 'test')
// 2. .env.local  (when NODE_ENV === 'development')
// 3. .env        (fallback)
let envFile = '.env'

if (process.env.NODE_ENV === 'test') {
  envFile = '.env.test'
} else if (process.env.NODE_ENV === 'development') {
  envFile = '.env.local'
}

const envPath = path.join(rootDir, envFile)

if (fs.existsSync(envPath)) {
  console.log(`✅ Loading environment variables from ${envFile}`)
  dotenv.config({ path: envPath })
} else {
  console.warn(
    `⚠️  Environment file ${envFile} not found. Falling back to process.env`,
  )
}

// Export commonly used vars
export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 3000,
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_SECRET: process.env.JWT_SECRET!,
}
