import { getDb } from "../../../db/client";
import { todos } from "../../../db/schema";
import { desc } from "drizzle-orm";

export const todoQuery = {
    Query: {
        todos: async (
            _parent: unknown,
            _args: unknown,
            context: { env: Env }
        ) => {
            const db = getDb(context.env.DB);
            const rows = await db
                .select()
                .from(todos)
                .orderBy(desc(todos.id))
                .all();
            // Map to GraphQL shape (createdAt as ISO string)
            return rows.map((t) => ({
                id: t.id,
                title: t.title,
                completed: t.completed,
                createdAt:
                    t.createdAt instanceof Date
                        ? t.createdAt.toISOString()
                        : new Date(t.createdAt).toISOString(),
            }));
        },
    },
}