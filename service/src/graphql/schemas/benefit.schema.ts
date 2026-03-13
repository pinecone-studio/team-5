export const benefitTypeDefs = `
  type Benefit {
    id: ID!
    name: String!
    category: String
    subsidyPercent: Int!
    vendorName: String
    requiresContract: Boolean
    activeContractId: String
    isActive: Boolean
  }

  input CreateBenefitInput {
    name: String!
    category: String
    subsidyPercent: Int!
    vendorName: String
    requiresContract: Boolean
    activeContractId: String
    isActive: Boolean = true
  }

  input UpdateBenefitInput {
    id: ID!
    name: String
    category: String
    subsidyPercent: Int
    vendorName: String
    requiresContract: Boolean
    activeContractId: String
    isActive: Boolean
  }

  extend type Query {
    benefits: [Benefit!]!
    benefit(id: ID!): Benefit
  }

  extend type Mutation {
    createBenefit(input: CreateBenefitInput!): Benefit!
    updateBenefit(input: UpdateBenefitInput!): Benefit!
    deleteBenefit(id: ID!): Boolean!
  }
`;
