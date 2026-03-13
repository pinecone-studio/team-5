export const auditLogTypeDefs = `
  type AuditLog {
    id: ID!
    employeeId: ID
    employeeName: String
    benefitId: ID
    benefitName: String
    action: String!
    detail: String!
    performedByEmployeeId: ID
    performedBy: String!
    metadataJson: String
    createdAt: String!
  }

  extend type Query {
    auditLog(search: String, action: String, limit: Int): [AuditLog!]!
  }
`;
