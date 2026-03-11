const { createDefaultPreset } = require('ts-jest');

/** @type {import("jest").Config} **/
module.exports = {
	testEnvironment: 'node',

	transform: {
		'^.+\\.ts$': [
			'ts-jest',
			{
				tsconfig: 'test/tsconfig.json',
			},
		],
	},

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
