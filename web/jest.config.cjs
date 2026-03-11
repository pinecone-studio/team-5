const { createDefaultPreset } = require("ts-jest");

const tsJestPreset = createDefaultPreset();

/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestPreset.transform,
  },
  testMatch: ["**/*.test.ts"],
  collectCoverage: true,

  coverageThreshold: {
    global: {
      lines: 100,
      statements: 100,
      functions: 100,
      branches: 100,
    },
  },
};
