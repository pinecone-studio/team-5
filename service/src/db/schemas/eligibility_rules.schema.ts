import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { randomUUID } from "node:crypto";
import { benefits } from "./benefits.schema";


export const eligibility_rules = sqliteTable("eligibility_rules", {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

    benefit_id: text().references(() => benefits.id).notNull(),

    // rule_type: text(),  status...

    // operator: text(), eq neg...

    value: text({ mode: "json" }),

    error_message: text().notNull(),

    priority: integer().notNull(),

    is_active: integer({ mode: "boolean" }).notNull()
})