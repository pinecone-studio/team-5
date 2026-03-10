/** @type {import('jest').Config} */
module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	roots: ['<rootDir>/src', '<rootDir>/test'],
	testMatch: ['**/*.jest.spec.ts'],
	moduleFileExtensions: ['ts', 'js', 'json'],
	clearMocks: true,
};
