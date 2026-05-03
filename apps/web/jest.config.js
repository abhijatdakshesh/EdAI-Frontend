const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const config = {
  displayName: '@rv/web',
  // Default environment for API route tests
  testEnvironment: 'node',
  // Per-file override: tsx component tests use @jest-environment jsdom docblock
  testEnvironmentOptions: {},
  setupFiles: ['<rootDir>/jest.setup.ts'],
  setupFilesAfterFramework: [],
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
    'src/features/admin/alert-feed.tsx',
    'src/features/admin/attendance-audit.tsx',
    'src/features/admin/automation.tsx',
    'src/features/admin/bulk-import.tsx',
    'src/features/admin/comms-settings.tsx',
    'src/features/admin/language-prefs.tsx',
    'src/features/admin/promotion.tsx',
    'src/features/admin/reports-analytics.tsx',
    'src/features/admin/system-settings.tsx',
    'src/features/admin/naac.tsx',
    'src/features/admin/user-management.tsx',
  ],
  coverageThreshold: {
    global: {
      lines: 80,
      branches: 75,
      functions: 80,
      statements: 80,
    },
  },
};

module.exports = createJestConfig(config);
