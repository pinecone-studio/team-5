import { getDb } from "../../../db/client";
import { employee } from "../../../db/schemas/employee.schema";
import { desc } from "drizzle-orm";

export const employeeQuery = {
    Query: {
        employees: async (
            _parent: unknown,
            _args: unknown,
            context: { env: Env }
        ) => {
            const db = getDb(context.env.DB);
            const rows = await db
                .select()
                .from(employee)
                .orderBy(desc(employee.id))
                .all();
            return rows.map((row) => ({
                id: row.id,
                fullName: row.full_name,
                status: row.status,
                okrStatus: row.okr_status,
                lateCount: row.lateCount ?? 0,
            }));
        },
    },
}
