import { todoMutation } from "./mutation/todo.mutations";
import { todoQuery } from "./query/todo.query";


export const resolvers = [todoQuery, todoMutation]