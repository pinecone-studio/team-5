import { sqliteTable, text } from "drizzle-orm/sqlite-core";

import { benefits } from "./benefits.schema";
import { employee } from "./employee.schema";

export const audit_logs = sqliteTable("audit_logs", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),

	employee_id: text("employee_id").references(() => employee.id),

	benefit_id: text("benefit_id").references(() => benefits.id),

	action: text("action").notNull(),

	detail: text("detail").notNull(),

	performed_by_employee_id: text("performed_by_employee_id").references(
		() => employee.id,
	),

	performed_by_label: text("performed_by_label").notNull(),

	metadata_json: text("metadata_json", { mode: "json" }),

	created_at: text("created_at")
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
});
