const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^react-chartjs-2$': '<rootDir>/__mocks__/react-chartjs-2.ts',
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/tests/e2e/',
    '<rootDir>/tests/agent-interaction.spec.ts',
    '<rootDir>/tests/auth.spec.ts',
    '<rootDir>/tests/project-flow.spec.ts',
  ],
  transformIgnorePatterns: [
    '<rootDir>/node_modules/(?!(chart.js|react-chartjs-2)/)',
  ],
}

module.exports = createJestConfig(customJestConfig)
