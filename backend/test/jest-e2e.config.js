const baseConfig = require('../jest.config');

module.exports = {
  ...baseConfig,
  rootDir: '..',
  roots: ['<rootDir>/test'],
  testEnvironment: 'node',
  // Match both .ts and .js files (for e2e-spec and node_modules)
  testRegex: '.e2e-spec.ts$',

  // KEY FIX: Update transform to handle .js files and configure ts-jest
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', {
      // Force ts-jest to process JS files (needed for faker)
      isolatedModules: true,
      tsconfig: '<rootDir>/tsconfig.json',
    }],
  },

  // Tell Jest to transform @faker-js/faker (don't ignore it)
  transformIgnorePatterns: [
    'node_modules/(?!(?:@faker-js/faker)/)',
  ],

  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '^@filters(.*)$': '<rootDir>/src/filters$1',
    '^@guards(.*)$': '<rootDir>/src/guards$1',
    '^@interfaces(.*)$': '<rootDir>/src/interfaces$1',
    '^@pipes(.*)$': '<rootDir>/src/pipes$1',
    '^@dto(.*)$': '<rootDir>/src/dto$1',
    '^@shared(.*)$': '<rootDir>/src/modules/shared$1',
    '^@modules(.*)$': '<rootDir>/src/modules$1',
    '^@__types__(.*)$': '<rootDir>/src/__types__$1',
  },

  setupFilesAfterEnv: ['<rootDir>/test/setup-e2e.ts'],
};
