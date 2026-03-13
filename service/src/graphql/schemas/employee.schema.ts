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
    name: String!
    email: String
    nameEng: String
    role: String
    department: String
    responsibilityLevel: Int!
    status: EmployeeStatus
    employmentStatus: EmployeeStatus
    hireDate: String
    okrStatus: EmployeeOkrStatus
    okrSubmitted: Boolean!
    lateCount: Int!
    lateArrivalCount: Int!
    lateArrivalUpdatedAt: String
    employeeCode: String
    createdAt: String!
    updatedAt: String!
  }

  extend type Query {
    employees: [Employee!]!
  }

  extend type Mutation {
    createEmployee(
      fullName: String!
      name: String
      email: String
      nameEng: String
      role: String
      department: String
      responsibilityLevel: Int
      status: EmployeeStatus
      employmentStatus: EmployeeStatus
      hireDate: String
      okrStatus: EmployeeOkrStatus
      okrSubmitted: Boolean
      lateCount: Int
      lateArrivalCount: Int
      lateArrivalUpdatedAt: String
      employeeCode: String
    ): Employee!

    updateEmployee(
      id: ID!
      fullName: String
      name: String
      email: String
      nameEng: String
      role: String
      department: String
      responsibilityLevel: Int
      status: EmployeeStatus
      employmentStatus: EmployeeStatus
      hireDate: String
      okrStatus: EmployeeOkrStatus
      okrSubmitted: Boolean
      lateCount: Int
      lateArrivalCount: Int
      lateArrivalUpdatedAt: String
      employeeCode: String
    ): Employee!

    deleteEmployee(id: ID!): Boolean!
  }
`;
