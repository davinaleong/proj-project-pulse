const request = require('supertest');
const { createApp } = require('./dist/app');
const { e2eTestHelpers } = require('./tests/v1/e2e/e2e.helpers');

async function debugLogin() {
  try {
    console.log('Setting up test...');
    
    // Clean database first
    await e2eTestHelpers.cleanupDatabase();
    
    // Create user
    console.log('Creating test user...');
    const { user } = await e2eTestHelpers.createAuthenticatedUser();
    console.log('User created:', { id: user.id, email: user.email });

    // Create app
    const app = createApp();

    // Try login
    console.log('Attempting login...');
    const response = await request(app)
      .post('/api/v1/auth/login')
      .set('User-Agent', 'Device1/1.0')
      .send({
        email: user.email,
        password: 'TestPassword123!',
      });

    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(response.body, null, 2));
    
    if (response.status !== 200) {
      console.log('Response headers:', response.headers);
      console.log('Response text:', response.text);
    }

  } catch (error) {
    console.error('Error during debug:', error);
  } finally {
    await e2eTestHelpers.cleanupDatabase();
    await e2eTestHelpers.disconnectDatabase();
    process.exit(0);
  }
}

debugLogin();