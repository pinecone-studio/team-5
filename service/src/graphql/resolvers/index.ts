import { employeeQuery } from "./query/employee.query";
import { employeeMutation } from "./mutation/employee.mutations";
import { benefitQuery } from "./query/benefit.query";
import { benefitMutation } from "./mutation/benefit.mutations";
import { contractQuery } from "./query/contract.query";
import { contractMutation } from "./mutation/contract.mutations";
import { eligibilityRuleQuery } from "./query/eligibility_rule.query";
import { eligibilityRuleMutation } from "./mutation/eligibility_rule.mutations";
import { benefitEligibilityQuery } from "./query/benefit_eligibility.query";
import { benefitEligibilityMutation } from "./mutation/benefit_eligibility.mutations";
import { benefitRequestQuery } from "./query/benefit_request.query";
import { benefitRequestMutation } from "./mutation/benefit_request.mutations";

export const resolvers = [
	employeeQuery,
	employeeMutation,
	benefitQuery,
	benefitMutation,
	contractQuery,
	contractMutation,
	eligibilityRuleQuery,
	eligibilityRuleMutation,
	benefitEligibilityQuery,
	benefitEligibilityMutation,
	benefitRequestQuery,
	benefitRequestMutation,
];