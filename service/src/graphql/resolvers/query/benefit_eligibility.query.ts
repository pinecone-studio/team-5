import { and, eq } from "drizzle-orm";

import { getDb } from "../../../db/client";
import { benefit_eligibility } from "../../../db/schemas/benefit_eligibility.schema";
import { requireManagerAccess } from "../shared/authenticated-employee";

const mapEligibility = (row: typeof benefit_eligibility.$inferSelect) => ({
  employeeId: row.employee_id,
  benefitId: row.benefit_id,
  status: row.status,
  ruleEvaluationJson: JSON.stringify(row.rule_evaluation_json),
  computedAt: row.computed_at,
  overrideBy: row.override_by ?? null,
  overrideReason: row.override_reason ?? null,
  overrideExpiresAt: row.override_expires_at ?? null,
});

export const benefitEligibilityQuery = {
  Query: {
	    benefitEligibility: async (
	      _parent: unknown,
	      args: { employeeId?: string | null; benefitId?: string | null },
	      context: { env: Env },
	    ) => {
	      await requireManagerAccess(context);
	      const db = getDb(context.env.DB);

      const conditions = [];
      if (args.employeeId) {
        conditions.push(eq(benefit_eligibility.employee_id, args.employeeId));
      }
      if (args.benefitId) {
        conditions.push(eq(benefit_eligibility.benefit_id, args.benefitId));
      }

      const rows = await db
        .select()
        .from(benefit_eligibility)
        .where(
          conditions.length === 0
            ? undefined
            : conditions.length === 1
            ? conditions[0]
            : and(...conditions),
        )
        .all();

      return rows.map(mapEligibility);
    },
  },
};
