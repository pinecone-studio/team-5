import { eq } from "drizzle-orm";

import { getDb } from "../../../db/client";
import { benefit_requests } from "../../../db/schemas/benefit_request.schema";
import { recomputeBenefitEligibility } from "../shared/benefit-eligibility-engine";
import { requireManagerAccess } from "../shared/authenticated-employee";

const mapRequest = (row: typeof benefit_requests.$inferSelect) => ({
  id: row.id,
  employeeId: row.employee_id,
  benefitId: row.benefit_id,
  status: row.status,
  contractVersionAccepted: row.contract_version_accepted,
  contractAcceptedAt: row.contract_accepted_at,
  reviewedBy: row.reviewed_by ?? null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const benefitRequestMutation = {
  Mutation: {
    createBenefitRequest: async (
      _parent: unknown,
      args: { input: { employeeId: string; benefitId: string } },
      context: { env: Env },
    ) => {
      await requireManagerAccess(context);
      const db = getDb(context.env.DB);
      const eligibility = await recomputeBenefitEligibility(db, {
        employeeId: args.input.employeeId,
        benefitId: args.input.benefitId,
      });

      if (
        eligibility.row.status !== "eligible" &&
        eligibility.row.status !== "active"
      ) {
        const firstFailure = eligibility.evaluations.find((rule) => !rule.passed);
        throw new Error(
          firstFailure?.reason ??
            "This benefit cannot be requested because eligibility rules are not met.",
        );
      }

      const inserted = await db
        .insert(benefit_requests)
        .values({
          employee_id: args.input.employeeId,
          benefit_id: args.input.benefitId,
          status: "pending",
        })
        .returning()
        .get();

      return mapRequest(inserted);
    },

    updateBenefitRequestStatus: async (
      _parent: unknown,
      args: {
        input: {
          id: string;
          status: string;
          contractVersionAccepted?: string | null;
          contractAcceptedAt?: string | null;
          reviewedBy?: string | null;
        };
      },
      context: { env: Env },
    ) => {
      await requireManagerAccess(context);
      const db = getDb(context.env.DB);
      const { input } = args;

      const updated = await db
        .update(benefit_requests)
        .set({
          status: input.status as any,
          ...(input.contractVersionAccepted !== undefined
            ? { contract_version_accepted: input.contractVersionAccepted }
            : {}),
          ...(input.contractAcceptedAt !== undefined
            ? { contract_accepted_at: input.contractAcceptedAt }
            : {}),
          ...(input.reviewedBy !== undefined
            ? { reviewed_by: input.reviewedBy }
            : {}),
          updated_at: new Date().toISOString(),
        })
        .where(eq(benefit_requests.id, input.id))
        .returning()
        .get();

      if (!updated) throw new Error("Benefit request not found");
      return mapRequest(updated);
    },

    cancelBenefitRequest: async (
      _parent: unknown,
      args: { id: string },
      context: { env: Env },
    ) => {
      await requireManagerAccess(context);
      const db = getDb(context.env.DB);

      const updated = await db
        .update(benefit_requests)
        .set({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .where(eq(benefit_requests.id, args.id))
        .returning()
        .get();

      if (!updated) throw new Error("Benefit request not found");
      return mapRequest(updated);
    },
  },
};
