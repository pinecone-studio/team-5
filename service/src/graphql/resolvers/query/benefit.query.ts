import { desc, eq } from "drizzle-orm";

import { getDb } from "../../../db/client";
import { benefits } from "../../../db/schemas/benefits.schema";
import { ensureLocalBenefitsSeeded } from "../shared/local-dev-bootstrap";

const mapBenefit = (row: typeof benefits.$inferSelect) => ({
	id: row.id,
	name: row.name,
	category: row.category ?? null,
	subsidyPercent: row.subsidy_percent,
	vendorName: row.vendor_name ?? null,
	requiresContract: row.requires_contract ?? false,
	activeContractId: row.active_contract_id ?? null,
	isActive: row.is_active ?? false,
});

export const benefitQuery = {
	Query: {
		benefits: async (
			_parent: unknown,
			_args: unknown,
			context: { env: Env },
		) => {
			const db = getDb(context.env.DB);
			await ensureLocalBenefitsSeeded(db, context.env.FRONTEND_ORIGIN);
			const rows = await db
				.select()
				.from(benefits)
				.orderBy(desc(benefits.name))
				.all();

			return rows.map(mapBenefit);
		},

		benefit: async (
			_parent: unknown,
			args: { id: string },
			context: { env: Env },
		) => {
			const db = getDb(context.env.DB);
			await ensureLocalBenefitsSeeded(db, context.env.FRONTEND_ORIGIN);
			const row = await db
				.select()
				.from(benefits)
				.where(eq(benefits.id, args.id))
				.get();

			return row ? mapBenefit(row) : null;
		},
	},
};
