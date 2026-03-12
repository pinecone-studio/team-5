import { asc, eq } from 'drizzle-orm';

import { getDb } from '../../../db/client';
import { eligibility_rules } from '../../../db/schemas/eligibility_rules.schema';
import { normalizeStoredRuleValue, toRuleValueJson } from '../shared/eligibility-rule-config';

const mapRule = (row: typeof eligibility_rules.$inferSelect) => {
	const normalized = normalizeStoredRuleValue(row.value);

	return {
		id: row.id,
		benefitId: row.benefit_id,
		type: normalized.type,
		operator: normalized.operator,
		value: toRuleValueJson(normalized.value),
		valueJson: toRuleValueJson(normalized.value),
		configVersion: normalized.version,
		errorMessage: row.error_message,
		isActive: row.is_active ?? false,
	};
};

function getRuleVersion(row: typeof eligibility_rules.$inferSelect): number {
	return normalizeStoredRuleValue(row.value).version;
}

export const eligibilityRuleQuery = {
	Query: {
		eligibilityRules: async (
			_parent: unknown,
			args: {
				benefitId?: string | null;
				configVersion?: number | null;
				activeOnly?: boolean | null;
			},
			context: { env: Env }
		) => {
			const db = getDb(context.env.DB);

			let rows: (typeof eligibility_rules.$inferSelect)[];
			if (args.benefitId) {
				rows = await db.select().from(eligibility_rules).where(eq(eligibility_rules.benefit_id, args.benefitId)).all();
			} else {
				rows = await db.select().from(eligibility_rules).all();
			}

			if (args.activeOnly) {
				rows = rows.filter((row) => row.is_active ?? false);
			}

			if (args.configVersion != null) {
				rows = rows.filter((row) => getRuleVersion(row) === args.configVersion);
			}

			return rows.map(mapRule);
		},

		eligibilityRuleLatestVersion: async (_parent: unknown, args: { benefitId: string }, context: { env: Env }) => {
			const db = getDb(context.env.DB);
			const rows = await db.select().from(eligibility_rules).where(eq(eligibility_rules.benefit_id, args.benefitId)).all();

			if (rows.length === 0) return 1;

			return rows.reduce((latest, row) => Math.max(latest, getRuleVersion(row)), 1);
		},
	},
};
