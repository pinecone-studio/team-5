const { createDefaultPreset } = require("ts-jest");

const tsJestPreset = createDefaultPreset();

/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  testPathIgnorePatterns: ["/node_modules/"],
  transform: {
    ...tsJestPreset.transform,
  },
  testMatch: ["**/*.test.ts"],
  collectCoverage: true,
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "<rootDir>/app/",
    "<rootDir>/components/",
    "<rootDir>/worker/",
    "<rootDir>/lib/apollo-client.ts",
    "<rootDir>/lib/queries.ts",
    "<rootDir>/lib/utils.ts",
  ],

  coverageThreshold: {
    global: {
      lines: 100,
      statements: 100,
      functions: 100,
      branches: 100,
    },
  },
};
