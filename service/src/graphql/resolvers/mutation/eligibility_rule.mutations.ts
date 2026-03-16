import { asc, eq } from "drizzle-orm";

import { getDb } from "../../../db/client";
import { eligibility_rules } from "../../../db/schemas/eligibility_rules.schema";
import { requireManagerAccess } from "../shared/authenticated-employee";
import {
  normalizeStoredRuleValue,
  parseRuleInputValue,
  toRuleValueJson,
  type RuleOperator,
  type StoredEligibilityRuleValue,
} from "../shared/eligibility-rule-config";
import { requireManagerAccess } from "../shared/authenticated-employee";

const mapRule = (row: typeof eligibility_rules.$inferSelect) => {
  const normalized = normalizeStoredRuleValue(row.value);

  return {
    id: row.id,
    benefitId: row.benefit_id,
    type: normalized.type,
    operator: normalized.operator,
    value: toRuleValueJson(normalized.value),
    valueJson: toRuleValueJson(normalized.value),
    configVersion: normalized.version,
    errorMessage: row.error_message,
    priority: row.priority,
    isActive: row.is_active ?? false,
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function getLatestVersionForBenefit(
  db: ReturnType<typeof getDb>,
  benefitId: string,
): Promise<number> {
  const rows = await db
    .select()
    .from(eligibility_rules)
    .where(eq(eligibility_rules.benefit_id, benefitId))
    .all();

  if (rows.length === 0) return 1;

  return rows.reduce((latest, row) => {
    const normalized = normalizeStoredRuleValue(row.value);
    return Math.max(latest, normalized.version);
  }, 1);
}

async function getNextPriorityForVersion(
  db: ReturnType<typeof getDb>,
  benefitId: string,
  targetVersion: number,
): Promise<number> {
  const rows = await db
    .select()
    .from(eligibility_rules)
    .where(eq(eligibility_rules.benefit_id, benefitId))
    .orderBy(asc(eligibility_rules.priority))
    .all();

  const versionRows = rows.filter(
    (row) => normalizeStoredRuleValue(row.value).version === targetVersion,
  );

  if (versionRows.length === 0) return 1;

  return (
    versionRows.reduce((maxPriority, row) => Math.max(maxPriority, row.priority), 0) +
    1
  );
}

function buildStoredRuleValue(params: {
  base: StoredEligibilityRuleValue;
  value?: string | null;
  type?: string | null;
  operator?: RuleOperator | null;
  configVersion?: number | null;
}): StoredEligibilityRuleValue {
  const parsedInputValue =
    params.value !== undefined && params.value !== null
      ? parseRuleInputValue(params.value)
      : params.base.value;

  if (isRecord(parsedInputValue)) {
    return normalizeStoredRuleValue({
      ...parsedInputValue,
      type: params.type ?? parsedInputValue.type ?? params.base.type,
      operator:
        params.operator ?? parsedInputValue.operator ?? params.base.operator,
      version:
        params.configVersion ?? parsedInputValue.version ?? params.base.version,
      value: parsedInputValue.value ?? params.base.value,
    });
  }

  return normalizeStoredRuleValue({
    type: params.type ?? params.base.type,
    operator: params.operator ?? params.base.operator,
    version: params.configVersion ?? params.base.version,
    value: parsedInputValue,
  });
}

export const eligibilityRuleMutation = {
  Mutation: {
    createEligibilityRule: async (
      _parent: unknown,
      args: {
        input: {
          benefitId: string;
          value: string;
          type?: string | null;
          operator?: RuleOperator | null;
          configVersion?: number | null;
          errorMessage: string;
          priority?: number | null;
          isActive?: boolean | null;
        };
      },
      context: { env: Env },
	    ) => {
	      await requireManagerAccess(context);
	      const db = getDb(context.env.DB);
	      const { input } = args;
      const latestVersion = await getLatestVersionForBenefit(db, input.benefitId);
      const targetVersion = input.configVersion ?? latestVersion;
      const baseValue: StoredEligibilityRuleValue = {
        type: "custom",
        operator: "eq",
        version: targetVersion,
        value: null,
      };
      const storedRuleValue = buildStoredRuleValue({
        base: baseValue,
        value: input.value,
        type: input.type,
        operator: input.operator,
        configVersion: targetVersion,
      });
      const nextPriority =
        input.priority ??
        (await getNextPriorityForVersion(db, input.benefitId, storedRuleValue.version));

      const inserted = await db
        .insert(eligibility_rules)
        .values({
          benefit_id: input.benefitId,
          value: storedRuleValue,
          error_message: input.errorMessage,
          priority: nextPriority,
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
          type?: string | null;
          operator?: RuleOperator | null;
          configVersion?: number | null;
          errorMessage?: string | null;
          priority?: number | null;
          isActive?: boolean | null;
        };
      },
      context: { env: Env },
	    ) => {
	      await requireManagerAccess(context);
	      const db = getDb(context.env.DB);
	      const { input } = args;
      const existing = await db
        .select()
        .from(eligibility_rules)
        .where(eq(eligibility_rules.id, input.id))
        .get();

      if (!existing) throw new Error("Eligibility rule not found");

      const normalizedExisting = normalizeStoredRuleValue(existing.value);
      const nextValue = buildStoredRuleValue({
        base: normalizedExisting,
        value: input.value,
        type: input.type,
        operator: input.operator,
        configVersion: input.configVersion,
      });

      const updated = await db
        .update(eligibility_rules)
        .set({
          ...(input.value !== undefined ||
          input.type !== undefined ||
          input.operator !== undefined ||
          input.configVersion !== undefined
            ? { value: nextValue }
            : {}),
          ...(input.errorMessage !== undefined
            ? input.errorMessage != null
              ? { error_message: input.errorMessage }
              : {}
            : {}),
          ...(input.priority != null ? { priority: input.priority } : {}),
          ...(input.isActive !== undefined
            ? input.isActive != null
              ? { is_active: input.isActive }
              : {}
            : {}),
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
	      await requireManagerAccess(context);
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
