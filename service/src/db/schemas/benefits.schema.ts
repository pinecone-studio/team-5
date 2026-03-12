import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { contracts } from './contract.schema';

export const benefits = sqliteTable('benefits', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),

	name: text().notNull(),

	// category: text({ enum: ['wellness', 'equipment', 'financial', 'career', 'flexibility'] }).notNull(),

	subsidy_percent: integer().notNull(),

	vendor_name: text(),

	requires_contract: integer(),

	// active_contract_id: text().references(() => contracts.id),

	is_active: integer(),
});
