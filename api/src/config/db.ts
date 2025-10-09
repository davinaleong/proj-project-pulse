import { PrismaClient } from '@prisma/client'
import { ENV } from './env'

declare global {
  // allow attaching to global in development to prevent multiple clients
  var __prismaClient__: PrismaClient | undefined
}

let prisma: PrismaClient

if (ENV.NODE_ENV === 'production') {
  prisma = new PrismaClient()
} else {
  if (!global.__prismaClient__) {
    global.__prismaClient__ = new PrismaClient()
  }
  prisma = global.__prismaClient__
}

export async function connectDb() {
  try {
    await prisma.$connect()
    return prisma
  } catch (err) {
    console.error('Error connecting to database', err)
    throw err
  }
}

export async function disconnectDb() {
  try {
    await prisma.$disconnect()
  } catch (err) {
    console.error('Error disconnecting from database', err)
  }
}

export default prisma
