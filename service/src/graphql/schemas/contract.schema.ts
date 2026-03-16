export const contractTypeDefs = `
  type Contract {
    id: ID!
    benefitId: ID!
    vendorName: String!
    version: String!
    r2ObjectKey: String!
    sha256Hash: String!
    effectiveDate: String
    expiryDate: String
    isActive: Boolean
  }

  input CreateContractInput {
    benefitId: ID!
    vendorName: String!
    version: String!
    r2ObjectKey: String!
    sha256Hash: String!
    effectiveDate: String
    expiryDate: String
    isActive: Boolean = true
  }

  input UpdateContractInput {
    id: ID!
    vendorName: String
    version: String
    r2ObjectKey: String
    sha256Hash: String
    effectiveDate: String
    expiryDate: String
    isActive: Boolean
  }

  extend type Query {
    contracts(benefitId: ID): [Contract!]!
    contract(id: ID!): Contract
    activeContract(benefitId: ID!): Contract
  }

  extend type Mutation {
    createContract(input: CreateContractInput!): Contract!
    updateContract(input: UpdateContractInput!): Contract!
    deleteContract(id: ID!): Boolean!
  }
`;
