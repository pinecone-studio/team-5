import { eq } from "drizzle-orm";

import { getDb } from "../../../db/client";
import { eligibility_rules } from "../../../db/schemas/eligibility_rules.schema";

const mapRule = (row: typeof eligibility_rules.$inferSelect) => ({
  id: row.id,
  benefitId: row.benefit_id,
  value: row.value ?? "null",
  errorMessage: row.error_message,
  priority: row.priority,
  isActive: row.is_active ?? false,
});

export const eligibilityRuleQuery = {
  Query: {
    eligibilityRules: async (
      _parent: unknown,
      args: { benefitId?: string | null },
      context: { env: Env },
    ) => {
      const db = getDb(context.env.DB);

      let rows: typeof eligibility_rules.$inferSelect[];
      if (args.benefitId) {
        rows = await db
          .select()
          .from(eligibility_rules)
          .where(eq(eligibility_rules.benefit_id, args.benefitId))
          .all();
      } else {
        rows = await db.select().from(eligibility_rules).all();
      }

      return rows.map(mapRule);
    },
  },
};

