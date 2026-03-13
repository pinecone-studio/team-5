import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const benefits = sqliteTable('beneefots', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),

	name: text('name').notNull(),

	category: text('category'),

	subsidy_percent: integer('subsidy_percent').notNull(),

	vendor_name: text('vendor_name'),

	requires_contract: integer('requires_contract', { mode: 'boolean' }).default(false),

	active_contract_id: text('active_contract_id'),

	is_active: integer('is_active', { mode: 'boolean' }).default(true),
});
