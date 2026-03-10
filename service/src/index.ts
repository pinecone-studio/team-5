/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { Hono } from "hono";
import { desc, eq } from "drizzle-orm";

import { getDb } from "./db/client";
import { todos } from "./db/schema";
import { yoga } from "./graphql";

interface Env {
	DB: D1Database;
}

const app = new Hono<{ Bindings: Env }>();

app.get("/", (c) => c.text("Hello world!"));

app.all("/graphql", (c) => yoga.fetch(c.req.raw, c.env, c.executionCtx));

app.get("/todos", async (c) => {
	const db = getDb(c.env.DB);
	const rows = await db.select().from(todos).orderBy(desc(todos.id)).all();
	return c.json(rows);
});

app.post("/todos", async (c) => {
	const body: unknown = await c.req.json().catch(() => ({}));
	const title =
		typeof body === "object" &&
		body !== null &&
		"title" in body &&
		typeof (body as { title?: unknown }).title === "string"
			? (body as { title: string }).title.trim()
			: "";
	if (!title) return c.json({ error: "title is required" }, 400);

	const db = getDb(c.env.DB);
	const inserted = await db.insert(todos).values({ title }).returning().get();
	return c.json(inserted, 201);
});

app.patch("/todos/:id", async (c) => {
	const id = Number(c.req.param("id"));
	if (!Number.isInteger(id)) return c.json({ error: "invalid id" }, 400);

	const body: unknown = await c.req.json().catch(() => ({}));
	const completed =
		typeof body === "object" &&
		body !== null &&
		"completed" in body &&
		typeof (body as { completed?: unknown }).completed === "boolean"
			? (body as { completed: boolean }).completed
			: undefined;
	const title =
		typeof body === "object" &&
		body !== null &&
		"title" in body &&
		typeof (body as { title?: unknown }).title === "string"
			? (body as { title: string }).title.trim()
			: undefined;

	if (completed === undefined && title === undefined) {
		return c.json({ error: "nothing to update" }, 400);
	}

	const db = getDb(c.env.DB);
	const updated = await db
		.update(todos)
		.set({
			...(completed === undefined ? {} : { completed }),
			...(title === undefined ? {} : { title }),
		})
		.where(eq(todos.id, id))
		.returning()
		.get();

	if (!updated) return c.json({ error: "not found" }, 404);
	return c.json(updated);
});

export default {
	fetch: app.fetch,
} satisfies ExportedHandler<Env>;
