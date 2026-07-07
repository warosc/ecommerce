import type { Config } from 'jest';

const config: Config = {
  rootDir: '.',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/unit/**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  moduleNameMapper: {
    '^@optimus/contracts$': '<rootDir>/../../packages/contracts/src/index.ts',
  },
  clearMocks: true,
  collectCoverageFrom: [
    'src/inventory/domain/**/*.ts',
    'src/inventory/application/**/*.ts',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageThreshold: {
    global: { branches: 90, functions: 90, lines: 90, statements: 90 },
  },
};

export default config;
