/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/__tests__"],
  testMatch: ["**/*.test.ts"],
  setupFilesAfterEnv: ["<rootDir>/__tests__/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@tests/(.*)$": "<rootDir>/__tests__/$1",
  },
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.test.json",
      },
    ],
  },
  collectCoverageFrom: ["src/**/*.ts", "!src/main.ts", "!src/types/**/*.ts"],
  coverageDirectory: "coverage",
  clearMocks: true,
  restoreMocks: true,
};
