// Set test environment variables before importing any modules
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db'
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only'
process.env.PORT = '3001'

import { beforeAll, afterAll, beforeEach } from '@jest/globals'
import prisma from '../src/config/db'

beforeAll(async () => {
  // Connect to test database
  await prisma.$connect()
})

afterAll(async () => {
  // Clean up and disconnect
  await prisma.$disconnect()
})

beforeEach(async () => {
  // Clean up test data before each test
  // Delete in reverse order of dependencies
  await prisma.passwordResetToken.deleteMany()
  await prisma.setting.deleteMany()
  await prisma.session.deleteMany()
  await prisma.activity.deleteMany()
  await prisma.note.deleteMany()
  await prisma.task.deleteMany()
  await prisma.project.deleteMany()
  await prisma.profile.deleteMany()
  await prisma.user.deleteMany()
})

// Export test utilities
export { prisma }

// Mock console methods in tests
global.console = {
  ...console,
  // Suppress console.log in tests unless needed
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}
