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

export const eligibilityRuleMutation = {
  Mutation: {
    createEligibilityRule: async (
      _parent: unknown,
      args: {
        input: {
          benefitId: string;
          value: string;
          errorMessage: string;
          priority: number;
          isActive?: boolean | null;
        };
      },
      context: { env: Env },
    ) => {
      const db = getDb(context.env.DB);
      const { input } = args;

      const inserted = await db
        .insert(eligibility_rules)
        .values({
          benefit_id: input.benefitId,
          value: input.value,
          error_message: input.errorMessage,
          priority: input.priority,
          is_active: input.isActive ?? true,
        })
        .returning()
        .get();

      return mapRule(inserted);
    },

    updateEligibilityRule: async (
      _parent: unknown,
      args: {
        input: {
          id: string;
          value?: string | null;
          errorMessage?: string | null;
          priority?: number | null;
          isActive?: boolean | null;
        };
      },
      context: { env: Env },
    ) => {
      const db = getDb(context.env.DB);
      const { input } = args;

      const updated = await db
        .update(eligibility_rules)
        .set({
          ...(input.value !== undefined ? { value: input.value } : {}),
          ...(input.errorMessage !== null
            ? { error_message: input.errorMessage }
            : {}),
          ...(input.priority != null ? { priority: input.priority } : {}),
          ...(input.isActive !== null ? { is_active: input.isActive } : {}),
        })
        .where(eq(eligibility_rules.id, input.id))
        .returning()
        .get();

      if (!updated) throw new Error("Eligibility rule not found");
      return mapRule(updated);
    },

    deleteEligibilityRule: async (
      _parent: unknown,
      args: { id: string },
      context: { env: Env },
    ) => {
      const db = getDb(context.env.DB);
      const deleted = await db
        .delete(eligibility_rules)
        .where(eq(eligibility_rules.id, args.id))
        .returning()
        .get();

      return !!deleted;
    },
  },
};

