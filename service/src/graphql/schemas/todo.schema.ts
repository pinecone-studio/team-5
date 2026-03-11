export const todoTypeDefs = `
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
`