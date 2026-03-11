import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";


export const benefits = sqliteTable("beneefots", {
    id: text('id')
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),

    name: text().notNull(),

    // category: text().notNull(),

    subsidy_percent: integer().notNull(),

    vendor_name: text(),

    requires_contract: integer({ mode: "boolean" }),

    // active_contract_id: text().references(() => contractId) REPLACE WITH CONTRACT ID ONCE SCHEMA IS FINISHED

    is_active: integer({ mode: "boolean" })

})