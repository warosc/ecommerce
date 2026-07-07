import type { Config } from 'jest';

/**
 * Tests unitarios: dominio + aplicación (núcleo puro, sin framework ni BD).
 * La cobertura se exige (>90%) sobre esas capas; la capa HTTP y el adaptador
 * Prisma se validan por comportamiento en los tests e2e.
 */
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
    'src/catalog/domain/**/*.ts',
    'src/catalog/application/**/*.ts',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageThreshold: {
    global: { branches: 90, functions: 90, lines: 90, statements: 90 },
  },
};

export default config;
