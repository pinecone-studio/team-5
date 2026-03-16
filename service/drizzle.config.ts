import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	schema: './src/db/schemas/*',
	out: './drizzle/migrations',
	dialect: 'sqlite',
	driver: 'd1-http',
	dbCredentials: {
		accountId: '630398f7cca5a714a459a22c46cd6b52',
		databaseId: 'c2fa4f72-0c7d-4402-b6e6-f4135abf4dec',
		token: 'Wfz6Y0N0zfs0hmYD4xHtOowp5jsXJzDZHa4zrP7g',
	},
});
