import { createSchema, createYoga } from "graphql-yoga";
import { desc, eq } from "drizzle-orm";

import { getDb } from "./db/client";
import { todos } from "./db/schema";

type YogaContext = {
	env: Env;
};

export const yoga = createYoga<YogaContext>({
	graphqlEndpoint: "/graphql",
	schema: createSchema({
		typeDefs: /* GraphQL */ `

			type Todo {
				id: ID!
				title: String!
				completed: Boolean!
				createdAt: String!
			}	

			type Query {
				todos: [Todo!]!
			}

			type Mutation {
				createTodo(title: String!): Todo!
				updateTodo(id: ID!, title: String, completed: Boolean): Todo!
				deleteTodo(id: ID!): Boolean!
			}
		`,
		resolvers: {
			Query: {
				todos: async (
					_parent: unknown,
					_args: unknown,
					context: YogaContext
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
			Mutation: {
				createTodo: async (
					_parent: unknown,
					args: { title: string },
					context: YogaContext
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
					context: YogaContext
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
					context: YogaContext
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
		},
	}),
	context: (ctx) => ({
		env: ctx.env,
	}),
	landingPage: true,
	graphiql: true,
});

