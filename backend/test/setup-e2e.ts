// Set environment to test
process.env.NODE_ENV = 'test';
process.env.PORT = '3001'; // Use a different port for testing

// Increase timeout for E2E tests (application startup can be slow)
jest.setTimeout(30000);

// We don't connect to the DB here because each spec file
// will handle the app creation and database connection lifecycle
// to ensure isolation.
