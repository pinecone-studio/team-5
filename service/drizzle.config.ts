import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { defineConfig } from 'drizzle-kit';

function loadEnvFile(filePath: string) {
	if (!existsSync(filePath)) {
		return;
	}

	const content = readFileSync(filePath, 'utf8');

	for (const line of content.split(/\r?\n/)) {
		const trimmed = line.trim();

		if (!trimmed || trimmed.startsWith('#')) {
			continue;
		}

		const separatorIndex = trimmed.indexOf('=');
		if (separatorIndex === -1) {
			continue;
		}

		const key = trimmed.slice(0, separatorIndex).trim();
		const rawValue = trimmed.slice(separatorIndex + 1).trim();
		const unquotedValue = rawValue.replace(/^(['"])(.*)\1$/, '$2');

		if (!(key in process.env)) {
			process.env[key] = unquotedValue;
		}
	}
}

loadEnvFile(path.join(__dirname, '.env'));
loadEnvFile(path.join(__dirname, '.dev.vars'));

function getEnv(name: string, fallback: string): string {
	const value = process.env[name]?.trim();
	return value && value.length > 0 ? value : fallback;
}

export default defineConfig({
	schema: './src/db/schemas/*',
	out: './drizzle/migrations',
	dialect: 'sqlite',
	driver: 'd1-http',
	dbCredentials: {
		accountId: getEnv('CLOUDFLARE_ACCOUNT_ID', 'replace_me'),
		databaseId: getEnv('CLOUDFLARE_D1_DATABASE_ID', 'replace_me'),
		token: getEnv('CLOUDFLARE_API_TOKEN', 'replace_me'),
	},
});
