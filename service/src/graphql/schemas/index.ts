import { employeeTypeDefs } from "./employee.schema";
import { todoTypeDefs } from "./todo.schema";
import { benefitTypeDefs } from "./benefit.schema";
import { contractTypeDefs } from "./contract.schema";
import { eligibilityRuleTypeDefs } from "./eligibility_rule.schema";
import { benefitEligibilityTypeDefs } from "./benefit_eligibility.schema";
import { benefitRequestTypeDefs } from "./benefit_request.schema";

export const typeDefs = [
	`
  type Query
  type Mutation
  `,
	employeeTypeDefs,
	todoTypeDefs,
	benefitTypeDefs,
	contractTypeDefs,
	eligibilityRuleTypeDefs,
	benefitEligibilityTypeDefs,
	benefitRequestTypeDefs,
];