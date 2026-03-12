export const employeeTypeDefs = `
  enum EmployeeStatus {
    active
    terminated
    leave
    probation
  }

  type Employee {
    id: ID!
    email: String!
    fullName: String!
    role: String!
    department: String!
    responsibilityLevel: Int!
    status: EmployeeStatus
    hireDate: String!
    okrSubmitted: Int!
    lateCount: Int!
    createdAt: String!
    updatedAt: String!
  }

  extend type Query {
    employees: [Employee!]!
  }

  extend type Mutation {
    createEmployee(
      email: String!
    fullName: String!
    role: String!
    department: String!
    responsibilityLevel: Int!
    status: EmployeeStatus
    hireDate: String
    ): Employee!

    updateEmployee(
      id: ID!
    email: String

      fullName: String
      role: String
    department: String
    responsibilityLevel: Int
      status: EmployeeStatus
      okrSubmitted: Int
      lateCount: Int
    ): Employee!

    deleteEmployee(id: ID!): Boolean!
  }
`;
