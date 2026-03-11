export const eligibilityRuleTypeDefs = `
  type EligibilityRule {
    id: ID!
    benefitId: ID!
    value: String!        # JSON string
    errorMessage: String!
    priority: Int!
    isActive: Boolean!
  }

  input CreateEligibilityRuleInput {
    benefitId: ID!
    value: String!
    errorMessage: String!
    priority: Int!
    isActive: Boolean = true
  }

  input UpdateEligibilityRuleInput {
    id: ID!
    value: String
    errorMessage: String
    priority: Int
    isActive: Boolean
  }

  extend type Query {
    eligibilityRules(benefitId: ID): [EligibilityRule!]!
  }

  extend type Mutation {
    createEligibilityRule(input: CreateEligibilityRuleInput!): EligibilityRule!
    updateEligibilityRule(input: UpdateEligibilityRuleInput!): EligibilityRule!
    deleteEligibilityRule(id: ID!): Boolean!
  }
`;

