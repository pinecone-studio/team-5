import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	schema: "./src/db/schemas/*",
	out: "./drizzle/migrations",
	dialect: "sqlite",
	driver: "d1-http",
	dbCredentials: {
		accountId: "14a670312375f3f15fe2f605edb6b164",
		databaseId: "14b46022-5b5d-4082-8432-73ab54dd7b7c",
		token: "W4GMQ3OcI08pbwpBWCBhmhbhNHWosuQ5A29RVPZD"
	}
});

