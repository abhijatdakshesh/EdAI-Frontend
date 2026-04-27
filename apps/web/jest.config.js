const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const config = {
  displayName: '@rv/web',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.ts'],
  restoreMocks: true,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
  ],
  collectCoverageFrom: [
    'src/features/voice-calling/repository.ts',
    'src/app/api/voice/trigger/route.ts',
    'src/app/api/admin/naac/metrics/route.ts',
    'src/app/api/compliance/dashboard/route.ts',
  ],
  coverageThreshold: {
    global: {
      lines: 100,
      branches: 100,
      functions: 100,
      statements: 100,
    },
  },
};

module.exports = createJestConfig(config);
