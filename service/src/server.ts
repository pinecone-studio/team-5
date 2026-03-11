import { createServer } from "node:http"
import { createSchema, createYoga } from "graphql-yoga"

import { resolvers } from "./graphql/resolvers"
import { typeDefs } from "./graphql/schemas"

export const yoga = createYoga({
	schema: createSchema({
		typeDefs,
		resolvers
	}),
})

const server = createServer(yoga)

server.listen(4000, () => {
	console.log("🚀 Server running on http://localhost:4000/graphql")
})
