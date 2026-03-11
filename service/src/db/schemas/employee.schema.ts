import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const employee = sqliteTable('benefit_employee', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),

	full_name: text('full_name').notNull(),

	status: text('status', {
		enum: ['active', 'terminated', 'leave', 'probation'],
	}).default('active'),

	okr_status: text('okr_status', {
		enum: ['submitted', 'success', 'fail'],
	}),

	lateCount: int('lateCount').default(0),
});
