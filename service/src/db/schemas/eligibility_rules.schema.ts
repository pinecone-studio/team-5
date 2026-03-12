import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { benefits } from "./benefits.schema";

export const eligibility_rules = sqliteTable("eligibility_rules", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  benefit_id: text("benefit_id")
    .references(() => benefits.id)
    .notNull(),

  // JSON object: { type, operator, value, version }
  value: text("value", { mode: "json" }),

  error_message: text("error_message").notNull(),

  priority: integer("priority").notNull().default(0),

  is_active: integer("is_active", { mode: "boolean" })
    .notNull()
    .default(true),
});
