const jwt = require('jsonwebtoken')

// Test the JWT creation and verification with exact same values
const jwtSecret = 'test-jwt-secret-key-for-testing-only'

// Create a token like our helper does
const payload = {
  uuid: 'test-uuid-123',
  email: 'test@example.com',
  role: 'USER',
}

const token = jwt.sign(payload, jwtSecret, { expiresIn: '1h' })
console.log('Generated token:', token)

// Try to verify it
try {
  const decoded = jwt.verify(token, jwtSecret)
  console.log('Decoded successfully:', decoded)
} catch (error) {
  console.log('Verification failed:', error.message)
}
