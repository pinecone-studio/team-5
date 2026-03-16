import { and, eq } from "drizzle-orm";

import { getDb } from "../../../db/client";
import { benefit_eligibility } from "../../../db/schemas/benefit_eligibility.schema";
import { recomputeBenefitEligibility } from "../shared/benefit-eligibility-engine";
import { requireManagerAccess } from "../shared/authenticated-employee";
import {
  getBenefitName,
  writeAuditLog,
} from "../shared/audit-log";
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

function hasManualFields(input: {
  status?: string | null;
  ruleEvaluationJson?: string | null;
  computedAt?: string | null;
  overrideBy?: string | null;
  overrideReason?: string | null;
  overrideExpiresAt?: string | null;
}): boolean {
  return (
    input.status !== undefined ||
    input.ruleEvaluationJson !== undefined ||
    input.computedAt !== undefined ||
    input.overrideBy !== undefined ||
    input.overrideReason !== undefined ||
    input.overrideExpiresAt !== undefined
  );
}

export const benefitEligibilityMutation = {
  Mutation: {
    upsertBenefitEligibility: async (
      _parent: unknown,
      args: {
        input: {
          employeeId: string;
          benefitId: string;
          status?: string | null;
          ruleEvaluationJson?: string | null;
          computedAt?: string | null;
          overrideBy?: string | null;
          overrideReason?: string | null;
          overrideExpiresAt?: string | null;
        };
      },
      context: { env: Env },
    ) => {
      const auth = await requireManagerAccess(context);
      const db = getDb(context.env.DB);
      const { input } = args;
      const shouldUseRuleEngine = !hasManualFields(input);

      if (shouldUseRuleEngine) {
        const computed = await recomputeBenefitEligibility(db, {
          employeeId: input.employeeId,
          benefitId: input.benefitId,
        });

        const benefitName = await getBenefitName(db, input.benefitId);
        const firstFailure = computed.evaluations.find((rule) => !rule.passed);

        await writeAuditLog(db, {
          employeeId: input.employeeId,
          benefitId: input.benefitId,
          action: "Eligibility Recomputed",
          detail: firstFailure?.reason
            ? `${benefitName ?? "Benefit"} eligibility recomputed: ${computed.row.status}. ${firstFailure.reason}`
            : `${benefitName ?? "Benefit"} eligibility recomputed: ${computed.row.status}.`,
          performedByEmployeeId: auth.employee.id,
          performedByLabel: auth.employee.full_name,
          metadata: {
            status: computed.row.status,
            source: "upsertBenefitEligibility",
          },
        });

        return mapEligibility(computed.row);
      }

      const existing = await db
        .select()
        .from(benefit_eligibility)
        .where(
          and(
            eq(benefit_eligibility.employee_id, input.employeeId),
            eq(benefit_eligibility.benefit_id, input.benefitId),
          ),
        )
        .get();

      if (!existing) {
        const inserted = await db
          .insert(benefit_eligibility)
          .values({
            employee_id: input.employeeId,
            benefit_id: input.benefitId,
            status: (input.status as any) ?? "pending",
            rule_evaluation_json:
              input.ruleEvaluationJson != null
                ? JSON.parse(input.ruleEvaluationJson)
                : [],
            computed_at: input.computedAt ?? new Date().toISOString(),
            override_by: auth.employee.id,
            override_reason: input.overrideReason ?? null,
            override_expires_at: input.overrideExpiresAt ?? null,
          })
          .returning()
          .get();

        const benefitName = await getBenefitName(db, input.benefitId);

        const detailParts = [
          `${benefitName ?? "Benefit"} eligibility manually set to ${inserted.status}.`,
        ];

        if (input.overrideReason) {
          detailParts.push(input.overrideReason);
        }

        await writeAuditLog(db, {
          employeeId: input.employeeId,
          benefitId: input.benefitId,
          action: "Eligibility Overridden",
          detail: detailParts.join(" "),
          performedByEmployeeId: auth.employee.id,
          performedByLabel: auth.employee.full_name,
          metadata: {
            status: inserted.status,
            overrideReason: input.overrideReason ?? null,
            overrideExpiresAt: input.overrideExpiresAt ?? null,
            source: "upsertBenefitEligibility",
          },
        });

        return mapEligibility(inserted);
      }

      const updated = await db
        .update(benefit_eligibility)
        .set({
          ...(input.status != null ? { status: input.status as any } : {}),
          ...(input.ruleEvaluationJson !== undefined
            ? {
                rule_evaluation_json:
                  input.ruleEvaluationJson != null
                    ? JSON.parse(input.ruleEvaluationJson)
                    : [],
              }
            : {}),
          ...(input.computedAt !== undefined
            ? {
                computed_at:
                  input.computedAt != null
                    ? input.computedAt
                    : new Date().toISOString(),
              }
            : {}),
          override_by: auth.employee.id,
          ...(input.overrideReason !== undefined
            ? { override_reason: input.overrideReason }
            : {}),
          ...(input.overrideExpiresAt !== undefined
            ? { override_expires_at: input.overrideExpiresAt }
            : {}),
        })
        .where(
          and(
            eq(benefit_eligibility.employee_id, input.employeeId),
            eq(benefit_eligibility.benefit_id, input.benefitId),
          ),
        )
        .returning()
        .get();

      const benefitName = await getBenefitName(db, input.benefitId);

      const detailParts = [
        `${benefitName ?? "Benefit"} eligibility manually updated to ${updated.status}.`,
      ];

      if (input.overrideReason) {
        detailParts.push(input.overrideReason);
      }

      await writeAuditLog(db, {
        employeeId: input.employeeId,
        benefitId: input.benefitId,
        action: "Eligibility Overridden",
        detail: detailParts.join(" "),
        performedByEmployeeId: auth.employee.id,
        performedByLabel: auth.employee.full_name,
        metadata: {
          status: updated.status,
          overrideReason: input.overrideReason ?? null,
          overrideExpiresAt: input.overrideExpiresAt ?? null,
          source: "upsertBenefitEligibility",
        },
      });

      return mapEligibility(updated);
    },

    recomputeBenefitEligibility: async (
      _parent: unknown,
      args: {
        input: {
          employeeId: string;
          benefitId: string;
        };
      },
      context: { env: Env },
    ) => {
      const auth = await requireManagerAccess(context);
      const db = getDb(context.env.DB);
      const computed = await recomputeBenefitEligibility(db, args.input);
      const benefitName = await getBenefitName(db, args.input.benefitId);
      const firstFailure = computed.evaluations.find((rule) => !rule.passed);

      await writeAuditLog(db, {
        employeeId: args.input.employeeId,
        benefitId: args.input.benefitId,
        action: "Eligibility Recomputed",
        detail: firstFailure?.reason
          ? `${benefitName ?? "Benefit"} eligibility recomputed: ${computed.row.status}. ${firstFailure.reason}`
          : `${benefitName ?? "Benefit"} eligibility recomputed: ${computed.row.status}.`,
        performedByEmployeeId: auth.employee.id,
        performedByLabel: auth.employee.full_name,
        metadata: {
          status: computed.row.status,
          source: "recomputeBenefitEligibility",
        },
      });

      return mapEligibility(computed.row);
    },
  },
};
