const { createDefaultPreset } = require("ts-jest");

const tsJestPreset = createDefaultPreset();

/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestPreset.transform,
  },
  testMatch: ["**/*.test.ts"],
};
