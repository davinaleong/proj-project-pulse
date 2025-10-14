/** @type {import('ts-jest').JestConfigWithTsJest} */
// eslint-disable-next-line no-undef
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  verbose: true,
  clearMocks: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['/node_modules/', '/tests/', '/dist/'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  // Limit concurrency to reduce database connection pressure
  maxWorkers: 1,
  maxConcurrency: 1,
}
