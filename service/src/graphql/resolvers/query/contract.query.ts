import { desc, eq } from "drizzle-orm";

import { getDb } from "../../../db/client";
import { contracts } from "../../../db/schemas/contract.schema";

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
      _args: unknown,
      context: { env: Env },
    ) => {
      const db = getDb(context.env.DB);
      const rows = await db
        .select()
        .from(contracts)
        .orderBy(desc(contracts.version))
        .all();
      return rows.map(mapContract);
    },

    contract: async (
      _parent: unknown,
      args: { id: string },
      context: { env: Env },
    ) => {
      const db = getDb(context.env.DB);
      const row = await db
        .select()
        .from(contracts)
        .where(eq(contracts.id, args.id))
        .get();
      return row ? mapContract(row) : null;
    },
  },
};

