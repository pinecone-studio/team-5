import { createSchema, createYoga } from "graphql-yoga"

import { resolvers } from "./graphql/resolvers"
import { typeDefs } from "./graphql/schemas"

export const yoga = createYoga({
	schema: createSchema({
		typeDefs,
		resolvers
	}),
})
