import { employeeTypeDefs } from "./employee.schema";
import { benefitTypeDefs } from "./benefit.schema";
import { contractTypeDefs } from "./contract.schema";
import { eligibilityRuleTypeDefs } from "./eligibility_rule.schema";
import { benefitEligibilityTypeDefs } from "./benefit_eligibility.schema";
import { benefitRequestTypeDefs } from "./benefit_request.schema";
import { employeePortalTypeDefs } from "./employee_portal.schema";
import { auditLogTypeDefs } from "./audit_log.schema";

export const typeDefs = [
	`
  type Query
  type Mutation
  `,
	employeeTypeDefs,
	benefitTypeDefs,
	contractTypeDefs,
	eligibilityRuleTypeDefs,
	benefitEligibilityTypeDefs,
	benefitRequestTypeDefs,
	employeePortalTypeDefs,
	auditLogTypeDefs,
];
