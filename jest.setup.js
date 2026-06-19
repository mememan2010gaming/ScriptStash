// Jest setup file for global test configuration
global.console = {
  ...console,
  // Suppress console errors during tests if needed
  error: jest.fn(),
  warn: jest.fn(),
}
