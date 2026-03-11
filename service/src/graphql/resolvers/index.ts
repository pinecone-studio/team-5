import { employeeMutation } from "./mutation/employee.mutations";
import { employeeQuery } from "./query/employee.query";


export const resolvers = [employeeQuery, employeeMutation]
