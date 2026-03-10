import { createSchema, createYoga } from "graphql-yoga";

export const yoga = createYoga({
	graphqlEndpoint: "/graphql",
	schema: createSchema({
		typeDefs: /* GraphQL */ `
			type Query {
				helloQuery: String!
			}

			type Mutation {
				helloMutation(name: String): String!
			}
		`,
		resolvers: {
			Query: {
				helloQuery: () => "Hello from GraphQL query",
			},
			Mutation: {
				helloMutation: (_parent: unknown, args: { name?: string | null }) =>
					`Hello from GraphQL mutation${args.name ? `, ${args.name}` : ""}`,
			},
		},
	}),
	landingPage: true,
	graphiql: true,
});

