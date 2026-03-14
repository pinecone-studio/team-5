import { eq } from "drizzle-orm";

import { getDb } from "../../../db/client";
import { contracts } from "../../../db/schemas/contract.schema";
import { requireManagerAccess } from "../shared/authenticated-employee";

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
	      await requireManagerAccess(context);
	      const { input } = args;
	      const db = getDb(context.env.DB);

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

      return mapContract(inserted);
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
	      await requireManagerAccess(context);
	      const { input } = args;
	      const db = getDb(context.env.DB);

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

      if (!updated) throw new Error("Contract not found");
      return mapContract(updated);
    },

    deleteContract: async (
      _parent: unknown,
      args: { id: string },
      context: { env: Env },
	    ) => {
	      await requireManagerAccess(context);
	      const db = getDb(context.env.DB);
      const deleted = await db
        .delete(contracts)
        .where(eq(contracts.id, args.id))
        .returning()
        .get();

      return !!deleted;
    },
  },
};
