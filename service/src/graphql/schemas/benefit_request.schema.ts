export const benefitRequestTypeDefs = `
  enum BenefitRequestStatus {
    pending
    approved
    rejected
    cancelled
  }

  type BenefitRequest {
    id: ID!
    employeeId: ID!
    benefitId: ID!
    status: BenefitRequestStatus!
    contractVersionAccepted: String
    contractAcceptedAt: String
    reviewedBy: ID
    createdAt: String!
    updatedAt: String!
  }

  input CreateBenefitRequestInput {
    employeeId: ID!
    benefitId: ID!
  }

  input UpdateBenefitRequestStatusInput {
    id: ID!
    status: BenefitRequestStatus!
    contractVersionAccepted: String
    contractAcceptedAt: String
    reviewedBy: ID
  }

  extend type Query {
    benefitRequests(employeeId: ID, benefitId: ID): [BenefitRequest!]!
  }

  extend type Mutation {
    createBenefitRequest(input: CreateBenefitRequestInput!): BenefitRequest!
    updateBenefitRequestStatus(input: UpdateBenefitRequestStatusInput!): BenefitRequest!
    cancelBenefitRequest(id: ID!): BenefitRequest!
  }
`;

