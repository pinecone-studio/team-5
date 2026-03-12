import { AnySQLiteColumn, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { benefits } from './benefits.schema';

export const contracts = sqliteTable('contracts', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),

	benefit_id: text('benefit_id')
		.references((): AnySQLiteColumn => benefits.id)
		.notNull(),

	vendor_name: text().notNull(),

	version: text().notNull(),

	r2_object_key: text().notNull(),

	// sha256_hash: text().notNull(),

	effective_date: text(),

	expiry_date: text(),

	is_active: integer({ mode: 'boolean' }).default(true),
});
