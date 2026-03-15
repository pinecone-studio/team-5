import { eq } from "drizzle-orm";

import { getDb } from "../../../db/client";
import { contracts } from "../../../db/schemas/contract.schema";
import {
  requireHrAdminAccess,
} from "../shared/authenticated-employee";
import {
  ensureBenefitExists,
  ensureUniqueContractVersion,
  getContractById,
  setActiveContractForBenefit,
  syncBenefitActiveContract,
} from "../shared/contract-lifecycle";
import { getBenefitName, writeAuditLog } from "../shared/audit-log";

const mapContract = (row: typeof contracts.$inferSelect) => ({
  id: row.id,
  benefitId: row.benefit_id,
  vendorName: row.vendor_name,
  version: row.version,
  r2ObjectKey: row.r2_object_key,
  sha256Hash: row.sha256_hash,
  effectiveDate: row.effective_date,
  expiryDate: row.expiry_date,
  isActive: row.is_active ?? false,
});

export const contractMutation = {
  Mutation: {
    createContract: async (
      _parent: unknown,
      args: {
        input: {
          benefitId: string;
          vendorName: string;
          version: string;
          r2ObjectKey: string;
          sha256Hash: string;
          effectiveDate?: string | null;
          expiryDate?: string | null;
          isActive?: boolean | null;
        };
      },
      context: { env: Env },
    ) => {
      const auth = await requireHrAdminAccess(context);
      const { input } = args;
      const db = getDb(context.env.DB);
      const benefitRow = await ensureBenefitExists(db, input.benefitId);

      await ensureUniqueContractVersion({
        db,
        benefitId: input.benefitId,
        version: input.version,
      });

      const inserted = await db
        .insert(contracts)
        .values({
          benefit_id: input.benefitId,
          vendor_name: input.vendorName,
          version: input.version,
          r2_object_key: input.r2ObjectKey,
          sha256_hash: input.sha256Hash,
          effective_date: input.effectiveDate ?? null,
          expiry_date: input.expiryDate ?? null,
          is_active: input.isActive ?? true,
        })
        .returning()
        .get();

      const lifecycleRow =
        inserted.is_active ?? false
          ? await setActiveContractForBenefit(db, inserted.benefit_id, inserted.id)
          : inserted;

      await writeAuditLog(db, {
        benefitId: inserted.benefit_id,
        action: "Contract Created",
        detail:
          inserted.is_active ?? false
            ? `${benefitRow.name} contract ${inserted.version} created and activated.`
            : `${benefitRow.name} contract ${inserted.version} created.`,
        performedByEmployeeId: auth.employee?.id ?? null,
        performedByLabel: auth.employee?.full_name ?? auth.clerkEmail,
        metadata: {
          contractId: inserted.id,
          version: inserted.version,
          isActive: lifecycleRow?.is_active ?? inserted.is_active ?? false,
          source: "createContract",
        },
      });

      return mapContract(lifecycleRow ?? inserted);
    },

    updateContract: async (
      _parent: unknown,
      args: {
        input: {
          id: string;
          vendorName?: string | null;
          version?: string | null;
          r2ObjectKey?: string | null;
          sha256Hash?: string | null;
          effectiveDate?: string | null;
          expiryDate?: string | null;
          isActive?: boolean | null;
        };
      },
      context: { env: Env },
    ) => {
      const auth = await requireHrAdminAccess(context);
      const { input } = args;
      const db = getDb(context.env.DB);
      const existing = await getContractById(db, input.id);

      if (!existing) throw new Error("Contract not found");

      if (input.version != null && input.version !== existing.version) {
        await ensureUniqueContractVersion({
          db,
          benefitId: existing.benefit_id,
          version: input.version,
          excludeId: existing.id,
        });
      }

      const updated = await db
        .update(contracts)
        .set({
          ...(input.vendorName != null
            ? { vendor_name: input.vendorName }
            : {}),
          ...(input.version != null ? { version: input.version } : {}),
          ...(input.r2ObjectKey != null
            ? { r2_object_key: input.r2ObjectKey }
            : {}),
          ...(input.sha256Hash != null
            ? { sha256_hash: input.sha256Hash }
            : {}),
          ...(input.effectiveDate !== undefined
            ? { effective_date: input.effectiveDate }
            : {}),
          ...(input.expiryDate !== undefined
            ? { expiry_date: input.expiryDate }
            : {}),
          ...(input.isActive !== undefined ? { is_active: input.isActive } : {}),
        })
        .where(eq(contracts.id, input.id))
        .returning()
        .get();

      const lifecycleRow =
        updated.is_active ?? false
          ? await setActiveContractForBenefit(db, updated.benefit_id, updated.id)
          : existing.is_active
            ? await syncBenefitActiveContract(db, updated.benefit_id)
            : updated;

      const benefitName = await getBenefitName(db, updated.benefit_id);
      const becameActive =
        !(existing.is_active ?? false) && Boolean(updated.is_active ?? false);
      const deactivated =
        Boolean(existing.is_active ?? false) && updated.is_active === false;

      await writeAuditLog(db, {
        benefitId: updated.benefit_id,
        action: becameActive
          ? "Contract Activated"
          : deactivated
            ? "Contract Deactivated"
            : "Contract Updated",
        detail: benefitName
          ? `${benefitName} contract ${updated.version} ${
              becameActive
                ? "was activated."
                : deactivated
                  ? "was deactivated."
                  : "was updated."
            }`
          : `Contract ${updated.version} ${
              becameActive
                ? "was activated."
                : deactivated
                  ? "was deactivated."
                  : "was updated."
            }`,
        performedByEmployeeId: auth.employee?.id ?? null,
        performedByLabel: auth.employee?.full_name ?? auth.clerkEmail,
        metadata: {
          contractId: updated.id,
          previousVersion: existing.version,
          version: updated.version,
          isActive: lifecycleRow?.is_active ?? updated.is_active ?? false,
          source: "updateContract",
        },
      });

      return mapContract(lifecycleRow ?? updated);
    },

    deleteContract: async (
      _parent: unknown,
      args: { id: string },
      context: { env: Env },
    ) => {
      const auth = await requireHrAdminAccess(context);
      const db = getDb(context.env.DB);
      const existing = await getContractById(db, args.id);

      if (!existing) throw new Error("Contract not found");
      const deleted = await db
        .delete(contracts)
        .where(eq(contracts.id, args.id))
        .returning()
        .get();

      if (deleted) {
        await syncBenefitActiveContract(db, deleted.benefit_id);
        const benefitName = await getBenefitName(db, deleted.benefit_id);

        await writeAuditLog(db, {
          benefitId: deleted.benefit_id,
          action: "Contract Deleted",
          detail: benefitName
            ? `${benefitName} contract ${deleted.version} was deleted.`
            : `Contract ${deleted.version} was deleted.`,
          performedByEmployeeId: auth.employee?.id ?? null,
          performedByLabel: auth.employee?.full_name ?? auth.clerkEmail,
          metadata: {
            contractId: deleted.id,
            version: deleted.version,
            source: "deleteContract",
          },
        });
      }

      return !!deleted;
    },
  },
};
