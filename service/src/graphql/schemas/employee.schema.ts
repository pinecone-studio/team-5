export const employeeTypeDefs = `
  enum EmployeeStatus {
    active
    terminated
    leave
    probation
  }

  enum EmployeeOkrStatus {
    submitted
    success
    fail
  }

  type Employee {
    id: ID!
    fullName: String!
    status: EmployeeStatus
    okrStatus: EmployeeOkrStatus
    lateCount: Int!
  }

  type Query {
    employees: [Employee!]!
  }

  type Mutation {
    createEmployee(
      fullName: String!
      status: EmployeeStatus
      okrStatus: EmployeeOkrStatus
      lateCount: Int
    ): Employee!

    updateEmployee(
      id: ID!
      fullName: String
      status: EmployeeStatus
      okrStatus: EmployeeOkrStatus
      lateCount: Int
    ): Employee!

    deleteEmployee(id: ID!): Boolean!
  }
`;
