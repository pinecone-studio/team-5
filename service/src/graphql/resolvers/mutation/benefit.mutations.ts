import { eq } from 'drizzle-orm';

import { getDb } from '../../../db/client';
import { benefits } from '../../../db/schemas/benefits.schema';

const mapBenefit = (row: typeof benefits.$inferSelect) => ({
	id: row.id,
	name: row.name,
	subsidyPercent: row.subsidy_percent,
	vendorName: row.vendor_name ?? null,
	requiresContract: row.requires_contract,
	isActive: row.is_active,
});

export const benefitMutation = {
	Mutation: {
		createBenefit: async (
			_parent: unknown,
			args: {
				input: {
					name: string;
					subsidyPercent: number;
					vendorName?: string | null;
					requiresContract?: number;
					isActive?: number;
				};
			},
			context: { env: Env }
		) => {
			try {
				const { input } = args;
				const db = getDb(context.env.DB);

				const id = crypto.randomUUID();

				const row = {
					id,
					name: input.name,
					subsidy_percent: input.subsidyPercent,
					vendor_name: input.vendorName ?? null,
					requires_contract: Number(input.requiresContract ?? 0),
					is_active: Number(input.isActive ?? 0),
				};

				await db.insert(benefits).values(row).run();

				return mapBenefit(row);
			} catch (err) {
				console.log(err);
				return err;
			}
		},

		updateBenefit: async (
			_parent: unknown,
			args: {
				input: {
					id: string;
					name?: string;
					subsidyPercent?: number;
					vendorName?: string | null;
					requiresContract?: number;
					isActive?: number;
				};
			},
			context: { env: Env }
		) => {
			const { input } = args;
			const db = getDb(context.env.DB);

			const updated = await db
				.update(benefits)
				.set({
					name: input.name,
					subsidy_percent: input.subsidyPercent,
					vendor_name: input.vendorName,
					requires_contract: input.requiresContract,
					is_active: input.isActive,
				})
				.where(eq(benefits.id, input.id))
				.returning()
				.get();

			if (!updated) {
				throw new Error('Benefit not found');
			}

			return mapBenefit(updated);
		},

		deleteBenefit: async (_parent: unknown, args: { id: string }, context: { env: Env }) => {
			const db = getDb(context.env.DB);
			const deleted = await db.delete(benefits).where(eq(benefits.id, args.id)).returning().get();

			return !!deleted;
		},
	},
};
