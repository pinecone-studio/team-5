const { createDefaultPreset } = require("ts-jest");

const tsJestPreset = createDefaultPreset();

/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestPreset.transform,
  },
  testMatch: ["**/*.test.ts"],
  moduleNameMapper: {
    // Use the browser build in tests so ApolloNextAppProvider works
    "^@apollo/client-integration-nextjs$":
      "@apollo/client-integration-nextjs/browser",
  },
};
