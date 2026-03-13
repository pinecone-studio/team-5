export const employeePortalTypeDefs = `
  enum MyBenefitStatus {
    active
    available
    pending
    locked
  }

  type BenefitRequestIntent {
    benefit: Benefit!
    eligibility: BenefitEligibility!
    activeContract: Contract
    existingRequest: BenefitRequest
    requiresContractAcceptance: Boolean!
  }

  type MyBenefit {
    benefit: Benefit!
    eligibility: BenefitEligibility!
    latestRequest: BenefitRequest
    activeContract: Contract
    status: MyBenefitStatus!
    canRequest: Boolean!
    failureReasons: [String!]!
  }

  input RequestBenefitInput {
    benefitId: ID!
  }

  input ConfirmBenefitRequestInput {
    benefitId: ID!
    contractVersionAccepted: String
    contractAcceptedAt: String
  }

  extend type Query {
    me: Employee!
    myBenefits: [MyBenefit!]!
  }

  extend type Mutation {
    requestBenefit(input: RequestBenefitInput!): BenefitRequestIntent!
    confirmBenefitRequest(input: ConfirmBenefitRequestInput!): BenefitRequest!
  }
`;
