// Set the timeout for tests (optional, but helpful if E2E tests are slow)
jest.setTimeout(30000);

// Ensure we are in test mode
process.env.NODE_ENV = 'test';

// Mock the JWT Secret if not set in environment
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-secret-key';
}
