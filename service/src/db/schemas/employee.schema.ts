import { int, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const employee = sqliteTable('employee', {
	id: text('id').primaryKey(),

	email: text('email').unique().notNull(),

	full_name: text('full_name').notNull(),

	role: text('role').notNull(),

	department: text().notNull(),

	responsibility_level: integer().notNull(),

	status: text('status', {
		enum: ['active', 'terminated', 'leave', 'probation'],
	}).default('active'),

	hire_date: text().notNull(),

	okr_submitted: integer().default(0),

	lateCount: int('lateCount').default(0),

	lateCount_updated_at: text(),

	createdAt: text(),

	updatedAt: text(),
});
