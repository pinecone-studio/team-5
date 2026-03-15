import { getDb } from "../../../db/client";
import { employee } from "../../../db/schemas/employee.schema";
import { desc } from "drizzle-orm";
import { requireHrAdminAccess } from "../shared/authenticated-employee";

const mapEmployee = (row: typeof employee.$inferSelect) => ({
    id: row.id,
    fullName: row.full_name,
    name: row.full_name,
    email: row.email ?? null,
    nameEng: row.name_eng ?? null,
    role: row.role ?? null,
    department: row.department ?? null,
    responsibilityLevel: row.responsibility_level ?? 0,
    status: row.employment_status ?? row.status,
    employmentStatus: row.employment_status ?? row.status,
    hireDate: row.hire_date ?? null,
    okrStatus: row.okr_status,
    okrSubmitted:
        row.okr_submitted ??
        (row.okr_status === "submitted" || row.okr_status === "success"),
    lateCount: row.late_arrival_count ?? row.lateCount ?? 0,
    lateArrivalCount: row.late_arrival_count ?? row.lateCount ?? 0,
    lateArrivalUpdatedAt: row.late_arrival_updated_at ?? null,
    employeeCode: row.employee_code ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

export const employeeQuery = {
    Query: {
        employees: async (
            _parent: unknown,
            _args: unknown,
            context: { env: Env }
        ) => {
            await requireHrAdminAccess(context);
            const db = getDb(context.env.DB);
            const rows = await db
                .select()
                .from(employee)
                .orderBy(desc(employee.id))
                .all();
            return rows.map(mapEmployee);
        },
    },
};
