export const contractTypeDefs = `
  type ContractSignature {
    id: ID!
    page: Int!
    xPct: Float!
    yPct: Float!
    widthPct: Float!
    heightPct: Float!
    r2ObjectKey: String!
  }

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
    signatures: [ContractSignature!]!
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

  input ContractSignatureInput {
    id: ID!
    page: Int!
    xPct: Float!
    yPct: Float!
    widthPct: Float!
    heightPct: Float!
    r2ObjectKey: String!
  }

  extend type Query {
    contracts(benefitId: ID): [Contract!]!
    contract(id: ID!): Contract
    activeContract(benefitId: ID!): Contract
  }

  extend type Mutation {
    createContract(input: CreateContractInput!): Contract!
    updateContract(input: UpdateContractInput!): Contract!
    updateContractSignatures(contractId: ID!, signatures: [ContractSignatureInput!]!): Contract!
    deleteContract(id: ID!): Boolean!
  }
`;
