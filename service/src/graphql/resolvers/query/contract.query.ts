import { desc, eq } from "drizzle-orm";

import { getDb } from "../../../db/client";
import { contracts } from "../../../db/schemas/contract.schema";
import { requireHrAdminAccess } from "../shared/authenticated-employee";
import { findActiveContractForBenefit } from "../shared/contract-lifecycle";

type ContractSignature = {
  id: string;
  page: number;
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
  r2ObjectKey: string;
};

function parseSignatures(raw: string | null | undefined): ContractSignature[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const obj = item as Record<string, unknown>;
      const id = typeof obj.id === "string" ? obj.id : null;
      const page = typeof obj.page === "number" ? obj.page : null;
      const xPct = typeof obj.xPct === "number" ? obj.xPct : null;
      const yPct = typeof obj.yPct === "number" ? obj.yPct : null;
      const widthPct = typeof obj.widthPct === "number" ? obj.widthPct : null;
      const heightPct = typeof obj.heightPct === "number" ? obj.heightPct : null;
      const r2ObjectKey = typeof obj.r2ObjectKey === "string" ? obj.r2ObjectKey : null;
      if (
        !id ||
        page == null ||
        xPct == null ||
        yPct == null ||
        widthPct == null ||
        heightPct == null ||
        !r2ObjectKey
      ) {
        return [];
      }
      return [{ id, page, xPct, yPct, widthPct, heightPct, r2ObjectKey }];
    });
  } catch {
    return [];
  }
}

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
  signatures: parseSignatures(row.signatures_json),
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
