import { primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { employee } from './employee.schema';
import { benefits } from './benefits.schema';

export const benefit_eligibility = sqliteTable(
	'benefit_eligibility',
	{
		// Composite key pieces
		employee_id: text('employee_id')
			.references(() => employee.id)
			.notNull(),

		benefit_id: text('benefit_id')
			.references(() => benefits.id)
			.notNull(),

		// 'active' | 'eligible' | 'locked' | 'pending'
		status: text('status', {
			enum: ['active', 'eligible', 'locked', 'pending'],
		})
			.notNull()
			.default('pending'),

		// JSON array of { rule_type, passed, reason }
		rule_evaluation_json: text('rule_evaluation_json', {
			mode: 'json',
		}).notNull(),

		// Timestamp of last computation (ISO string)
		computed_at: text('computed_at').notNull(),

		// HR admin who overrode (nullable) — FK to employee for now
		override_by: text('override_by').references(() => employee.id),

		// Mandatory justification for manual overrides
		override_reason: text('override_reason'),

		// Expiry for temporary exceptions (nullable)
		override_expires_at: text('override_expires_at'),
	},
	(table) => ({
		// Unique per employee-benefit pair
		pk: primaryKey({ columns: [table.employee_id, table.benefit_id] }),
	})
);
