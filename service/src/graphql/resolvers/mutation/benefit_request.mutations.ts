import { eq } from "drizzle-orm";

import { getDb } from "../../../db/client";
import { benefit_requests } from "../../../db/schemas/benefit_request.schema";
import { recomputeBenefitEligibility } from "../shared/benefit-eligibility-engine";
import {
  SYSTEM_AUDIT_ACTOR,
  getBenefitName,
  getEmployeeName,
  resolvePerformedByLabel,
  writeAuditLog,
} from "../shared/audit-log";

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

      const [employeeName, benefitName] = await Promise.all([
        getEmployeeName(db, inserted.employee_id),
        getBenefitName(db, inserted.benefit_id),
      ]);

      await writeAuditLog(db, {
        employeeId: inserted.employee_id,
        benefitId: inserted.benefit_id,
        action: "Requested",
        detail: benefitName
          ? `${benefitName} benefit request submitted.`
          : "Benefit request submitted.",
        performedByEmployeeId: inserted.employee_id,
        performedByLabel: employeeName ?? SYSTEM_AUDIT_ACTOR,
        metadata: {
          requestId: inserted.id,
          status: inserted.status,
          source: "createBenefitRequest",
        },
      });

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
      const db = getDb(context.env.DB);
      const { input } = args;
      const existing = await db
        .select()
        .from(benefit_requests)
        .where(eq(benefit_requests.id, input.id))
        .get();

      if (!existing) throw new Error("Benefit request not found");

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

      const [benefitName, performedByLabel] = await Promise.all([
        getBenefitName(db, updated.benefit_id),
        resolvePerformedByLabel(db, updated.reviewed_by, SYSTEM_AUDIT_ACTOR),
      ]);

      const action =
        updated.status === "approved"
          ? "Approved"
          : updated.status === "rejected"
            ? "Rejected"
            : updated.status === "cancelled"
              ? "Cancelled"
              : "Pending";

      await writeAuditLog(db, {
        employeeId: updated.employee_id,
        benefitId: updated.benefit_id,
        action,
        detail: benefitName
          ? `${benefitName} request status changed from ${existing.status} to ${updated.status}.`
          : `Benefit request status changed from ${existing.status} to ${updated.status}.`,
        performedByEmployeeId: updated.reviewed_by,
        performedByLabel,
        metadata: {
          requestId: updated.id,
          previousStatus: existing.status,
          status: updated.status,
          source: "updateBenefitRequestStatus",
        },
      });

      return mapRequest(updated);
    },

    cancelBenefitRequest: async (
      _parent: unknown,
      args: { id: string },
      context: { env: Env },
    ) => {
      const db = getDb(context.env.DB);
      const existing = await db
        .select()
        .from(benefit_requests)
        .where(eq(benefit_requests.id, args.id))
        .get();

      if (!existing) throw new Error("Benefit request not found");

      const updated = await db
        .update(benefit_requests)
        .set({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .where(eq(benefit_requests.id, args.id))
        .returning()
        .get();

      const [employeeName, benefitName] = await Promise.all([
        getEmployeeName(db, updated.employee_id),
        getBenefitName(db, updated.benefit_id),
      ]);

      await writeAuditLog(db, {
        employeeId: updated.employee_id,
        benefitId: updated.benefit_id,
        action: "Cancelled",
        detail: benefitName
          ? `${benefitName} request was cancelled.`
          : "Benefit request was cancelled.",
        performedByEmployeeId: updated.employee_id,
        performedByLabel: employeeName ?? SYSTEM_AUDIT_ACTOR,
        metadata: {
          requestId: updated.id,
          previousStatus: existing.status,
          status: updated.status,
          source: "cancelBenefitRequest",
        },
      });

      return mapRequest(updated);
    },
  },
};
