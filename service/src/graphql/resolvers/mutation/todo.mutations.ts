import { eq } from "drizzle-orm";
import { getDb } from "../../../db/client";
import { todos } from "../../../db/schema";

export const todoMutation = {
    Mutation: {
        createTodo: async (
            _parent: unknown,
            args: { title: string },
            context: { env: Env }
        ) => {
            const db = getDb(context.env.DB);
            const inserted = await db
                .insert(todos)
                .values({ title: args.title })
                .returning()
                .get();
            return {
                id: inserted.id,
                title: inserted.title,
                completed: inserted.completed,
                createdAt:
                    inserted.createdAt instanceof Date
                        ? inserted.createdAt.toISOString()
                        : new Date(inserted.createdAt).toISOString(),
            };
        },
        updateTodo: async (
            _parent: unknown,
            args: { id: string; title?: string | null; completed?: boolean | null },
            context: { env: Env }
        ) => {
            const id = Number(args.id);
            if (!Number.isInteger(id)) {
                throw new Error("Invalid id");
            }
            const db = getDb(context.env.DB);
            const updated = await db
                .update(todos)
                .set({
                    ...(args.title != null ? { title: args.title } : {}),
                    ...(args.completed != null ? { completed: args.completed } : {}),
                })
                .where(eq(todos.id, id))
                .returning()
                .get();
            if (!updated) {
                throw new Error("Todo not found");
            }
            return {
                id: updated.id,
                title: updated.title,
                completed: updated.completed,
                createdAt:
                    updated.createdAt instanceof Date
                        ? updated.createdAt.toISOString()
                        : new Date(updated.createdAt).toISOString(),
            };
        },
        deleteTodo: async (
            _parent: unknown,
            args: { id: string },
            context: { env: Env }
        ) => {
            const id = Number(args.id);
            if (!Number.isInteger(id)) {
                throw new Error("Invalid id");
            }
            const db = getDb(context.env.DB);
            const deleted = await db
                .delete(todos)
                .where(eq(todos.id, id))
                .returning()
                .get();
            return !!deleted;
        },
    },
}