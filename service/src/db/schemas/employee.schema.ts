import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const employee = sqliteTable('benefit_employee', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),

	full_name: text('full_name').notNull(),

	email: text('email'),

	name_eng: text('name_eng'),

	role: text('role'),

	department: text('department'),

	responsibility_level: int('responsibility_level').default(0),

	status: text('status', {
		enum: ['active', 'terminated', 'leave', 'probation'],
	}).default('active'),

	employment_status: text('employment_status', {
		enum: ['active', 'terminated', 'leave', 'probation'],
	}).default('active'),

	hire_date: text('hire_date'),

	okr_status: text('okr_status', {
		enum: ['submitted', 'success', 'fail'],
	}),

	okr_submitted: int('okr_submitted', { mode: 'boolean' }).default(false),

	lateCount: int('lateCount').default(0),

	late_arrival_count: int('late_arrival_count').default(0),

	late_arrival_updated_at: text('late_arrival_updated_at'),

	employee_code: text('employee_code'),

	created_at: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString()),

	updated_at: text('updated_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
});
