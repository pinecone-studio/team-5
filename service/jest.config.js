const { createDefaultPreset } = require('ts-jest');

/** @type {import("jest").Config} **/
module.exports = {
	testEnvironment: 'node',
	testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/test/index.spec.ts'],

	transform: {
		'^.+\\.ts$': [
			'ts-jest',
			{
				tsconfig: 'test/tsconfig.json',
			},
		],
	},

	collectCoverage: true,
	coveragePathIgnorePatterns: [
		'/node_modules/',
		'<rootDir>/src/index.ts',
		'<rootDir>/src/db/client.ts',
		'<rootDir>/src/db/schema.ts',
		'<rootDir>/src/graphql.ts',
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
