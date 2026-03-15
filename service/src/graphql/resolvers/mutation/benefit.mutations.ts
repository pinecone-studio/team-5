import { eq } from "drizzle-orm";

import { getDb } from "../../../db/client";
import { benefits } from "../../../db/schemas/benefits.schema";
import { requireHrAdminAccess } from "../shared/authenticated-employee";

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

export const benefitMutation = {
	Mutation: {
		createBenefit: async (
			_parent: unknown,
			args: {
				input: {
					name: string;
					category?: string | null;
					subsidyPercent: number;
					vendorName?: string | null;
					requiresContract?: boolean | null;
					activeContractId?: string | null;
					isActive?: boolean | null;
				};
			},
			context: { env: Env },
		) => {
			await requireHrAdminAccess(context);
			const { input } = args;
			const db = getDb(context.env.DB);

			const inserted = await db
				.insert(benefits)
				.values({
					name: input.name,
					category: input.category ?? null,
					subsidy_percent: input.subsidyPercent,
					vendor_name: input.vendorName ?? null,
					requires_contract: input.requiresContract ?? false,
					active_contract_id: input.activeContractId ?? null,
					is_active: input.isActive ?? true,
				})
				.returning()
				.get();

			return mapBenefit(inserted);
		},

		updateBenefit: async (
			_parent: unknown,
			args: {
				input: {
					id: string;
					name?: string | null;
					category?: string | null;
					subsidyPercent?: number | null;
					vendorName?: string | null;
					requiresContract?: boolean | null;
					activeContractId?: string | null;
					isActive?: boolean | null;
				};
			},
			context: { env: Env },
		) => {
			await requireHrAdminAccess(context);
			const { input } = args;
			const db = getDb(context.env.DB);

			const updated = await db
				.update(benefits)
				.set({
					...(input.name != null ? { name: input.name } : {}),
					...(input.category !== undefined ? { category: input.category } : {}),
					...(input.subsidyPercent != null
						? { subsidy_percent: input.subsidyPercent }
						: {}),
					...(input.vendorName !== undefined
						? { vendor_name: input.vendorName }
						: {}),
					...(input.requiresContract !== undefined
						? { requires_contract: input.requiresContract }
						: {}),
					...(input.activeContractId !== undefined
						? { active_contract_id: input.activeContractId }
						: {}),
					...(input.isActive !== undefined
						? { is_active: input.isActive }
						: {}),
				})
				.where(eq(benefits.id, input.id))
				.returning()
				.get();

			if (!updated) {
				throw new Error("Benefit not found");
			}

			return mapBenefit(updated);
		},

		deleteBenefit: async (
			_parent: unknown,
			args: { id: string },
			context: { env: Env },
		) => {
			await requireHrAdminAccess(context);
			const db = getDb(context.env.DB);
			const deleted = await db
				.delete(benefits)
				.where(eq(benefits.id, args.id))
				.returning()
				.get();

			return !!deleted;
		},
	},
};
