export const eligibilityRuleTypeDefs = `
  enum RuleOperator {
    eq
    neq
    lt
    lte
    gt
    gte
    in
    not_in
  }

  type EligibilityRule {
    id: ID!
    benefitId: ID!
    type: String!
    operator: RuleOperator!
    value: String!        # Backward compatible scalar value string
    valueJson: String!    # JSON-safe representation of expected value
    configVersion: Int!
    errorMessage: String!
    priority: Int!
    isActive: Boolean!
  }

  input CreateEligibilityRuleInput {
    benefitId: ID!
    value: String!
    type: String
    operator: RuleOperator = eq
    configVersion: Int
    errorMessage: String!
    priority: Int
    isActive: Boolean = true
  }

  input UpdateEligibilityRuleInput {
    id: ID!
    value: String
    type: String
    operator: RuleOperator
    configVersion: Int
    errorMessage: String
    priority: Int
    isActive: Boolean
  }

  extend type Query {
    eligibilityRules(
      benefitId: ID
      configVersion: Int
      activeOnly: Boolean = false
    ): [EligibilityRule!]!
    eligibilityRuleLatestVersion(benefitId: ID!): Int!
  }

  extend type Mutation {
    createEligibilityRule(input: CreateEligibilityRuleInput!): EligibilityRule!
    updateEligibilityRule(input: UpdateEligibilityRuleInput!): EligibilityRule!
    deleteEligibilityRule(id: ID!): Boolean!
  }
`;
