const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const customConfig = {
  displayName: '@rv/web',
  testEnvironment: 'node',
  testEnvironmentOptions: {},
  setupFiles: ['<rootDir>/jest.setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.jsdom.ts'],
  restoreMocks: true,
  moduleNameMapper: {
    // Intercept next-auth and its providers at the import-specifier level so that
    // @auth/core (ESM-only) never enters Jest's module graph. Must come before @/.
    '^jose$': '<rootDir>/__mocks__/jose.js',
    '^next-auth$': '<rootDir>/__mocks__/next-auth/index.js',
    '^next-auth/providers/credentials$': '<rootDir>/__mocks__/next-auth/providers/credentials.js',
    '^@/auth$': '<rootDir>/src/__mocks__/auth.js',
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

// Override nextJest's transformIgnorePatterns to allow transforming
// ESM-only packages that are transitive deps of next-auth.
async function jestConfig() {
  const nextJestConfig = await createJestConfig(customConfig)();
  return {
    ...nextJestConfig,
    transformIgnorePatterns: [
      '/node_modules/(?!(next-auth|@auth/core|oauth4webapi|@panva|jose|openid-client)/).*',
    ],
  };
}

module.exports = jestConfig;
