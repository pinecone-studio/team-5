import { sqliteTable, text } from "drizzle-orm/sqlite-core";

import { employee } from "./employee.schema";
import { benefits } from "./benefits.schema";

export const benefit_requests = sqliteTable("benefit_requests", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),

	employee_id: text("employee_id")
		.references(() => employee.id)
		.notNull(),

	benefit_id: text("benefit_id")
		.references(() => benefits.id)
		.notNull(),

	status: text("status", {
		enum: ["pending", "approved", "rejected", "cancelled"],
	})
		.notNull()
		.default("pending"),

	contract_version_accepted: text("contract_version_accepted"),

	contract_accepted_at: text("contract_accepted_at"),

	reviewed_by: text("reviewed_by").references(() => employee.id),

	created_at: text("created_at")
		.notNull()
		.$defaultFn(() => new Date().toISOString()),

	updated_at: text("updated_at")
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
});

