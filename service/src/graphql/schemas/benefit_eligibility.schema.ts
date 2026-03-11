export const benefitEligibilityTypeDefs = `
  enum BenefitEligibilityStatus {
    active
    eligible
    locked
    pending
  }

  type BenefitEligibility {
    employeeId: ID!
    benefitId: ID!
    status: BenefitEligibilityStatus!
    ruleEvaluationJson: String!   # JSON string
    computedAt: String!
    overrideBy: ID
    overrideReason: String
    overrideExpiresAt: String
  }

  extend type Query {
    benefitEligibility(
      employeeId: ID
      benefitId: ID
    ): [BenefitEligibility!]!
  }

  input UpdateBenefitEligibilityInput {
    employeeId: ID!
    benefitId: ID!
    status: BenefitEligibilityStatus
    ruleEvaluationJson: String
    computedAt: String
    overrideBy: ID
    overrideReason: String
    overrideExpiresAt: String
  }

  extend type Mutation {
    upsertBenefitEligibility(input: UpdateBenefitEligibilityInput!): BenefitEligibility!
  }
`;

