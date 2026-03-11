import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	schema: './src/db/schemas/*',
	out: './drizzle/migrations',
	dialect: 'sqlite',
});
