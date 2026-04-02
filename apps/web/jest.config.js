module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFiles: ['jest-canvas-mock'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/tests/e2e/',
    '<rootDir>/tests/agent-interaction.spec.ts',
    '<rootDir>/tests/auth.spec.ts',
    '<rootDir>/tests/project-flow.spec.ts',
  ],
  transformIgnorePatterns: ['<rootDir>/node_modules/'],
}
