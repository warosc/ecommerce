import type { Config } from 'jest';

const config: Config = {
  rootDir: '.',
  testEnvironment: 'node',
  setupFiles: ['reflect-metadata'],
  testMatch: ['<rootDir>/test/e2e/**/*.e2e-spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  moduleNameMapper: {
    '^@optimus/contracts$': '<rootDir>/../../packages/contracts/src/index.ts',
  },
  testTimeout: 30000,
};

export default config;
