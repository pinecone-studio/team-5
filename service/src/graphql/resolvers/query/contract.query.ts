import { desc, eq } from "drizzle-orm";

import { getDb } from "../../../db/client";
import { contracts } from "../../../db/schemas/contract.schema";
import { requireHrAdminAccess } from "../shared/authenticated-employee";
import { findActiveContractForBenefit } from "../shared/contract-lifecycle";

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

export const contractQuery = {
  Query: {
    contracts: async (
      _parent: unknown,
      args: { benefitId?: string | null },
      context: { env: Env },
    ) => {
      await requireHrAdminAccess(context);
      const db = getDb(context.env.DB);
      const rows = args.benefitId
        ? await db
            .select()
            .from(contracts)
            .where(eq(contracts.benefit_id, args.benefitId))
            .orderBy(desc(contracts.effective_date), desc(contracts.version))
            .all()
        : await db
            .select()
            .from(contracts)
            .orderBy(desc(contracts.effective_date), desc(contracts.version))
            .all();
      return rows.map(mapContract);
    },

	    contract: async (
	      _parent: unknown,
	      args: { id: string },
	      context: { env: Env },
	    ) => {
	      await requireHrAdminAccess(context);
	      const db = getDb(context.env.DB);
      const row = await db
        .select()
        .from(contracts)
        .where(eq(contracts.id, args.id))
        .get();
      return row ? mapContract(row) : null;
    },

    activeContract: async (
      _parent: unknown,
      args: { benefitId: string },
      context: { env: Env },
    ) => {
      await requireHrAdminAccess(context);
      const db = getDb(context.env.DB);
      const row = await findActiveContractForBenefit(db, args.benefitId);
      return row ? mapContract(row) : null;
    },
  },
};
