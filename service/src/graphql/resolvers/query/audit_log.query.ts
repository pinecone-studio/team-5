import { desc } from "drizzle-orm";

import { getDb } from "../../../db/client";
import { audit_logs } from "../../../db/schemas/audit_log.schema";
import { benefits } from "../../../db/schemas/benefits.schema";
import { employee } from "../../../db/schemas/employee.schema";
import { requireManagerAccess } from "../shared/authenticated-employee";

type AuditLogRow = typeof audit_logs.$inferSelect;

function mapMetadataJson(metadata: AuditLogRow["metadata_json"]) {
	if (metadata == null) return null;
	return JSON.stringify(metadata);
}

export const auditLogQuery = {
	Query: {
		auditLog: async (
			_parent: unknown,
			args: { search?: string | null; action?: string | null; limit?: number | null },
			context: { env: Env },
		) => {
			await requireManagerAccess(context);
			const db = getDb(context.env.DB);
			const [rows, employeeRows, benefitRows] = await Promise.all([
				db
					.select()
					.from(audit_logs)
					.orderBy(desc(audit_logs.created_at))
					.all(),
				db.select({ id: employee.id, fullName: employee.full_name }).from(employee).all(),
				db.select({ id: benefits.id, name: benefits.name }).from(benefits).all(),
			]);

			const employeeMap = new Map(
				employeeRows.map((row) => [row.id, row.fullName] as const),
			);
			const benefitMap = new Map(
				benefitRows.map((row) => [row.id, row.name] as const),
			);

			const normalizedAction = args.action?.trim().toLowerCase() ?? "";
			const normalizedSearch = args.search?.trim().toLowerCase() ?? "";
			const limit =
				typeof args.limit === "number" && args.limit > 0
					? Math.min(args.limit, 500)
					: 200;

			return rows
				.map((row) => {
					const employeeName =
						(row.employee_id ? employeeMap.get(row.employee_id) : null) ?? null;
					const benefitName =
						(row.benefit_id ? benefitMap.get(row.benefit_id) : null) ?? null;

					return {
						id: row.id,
						employeeId: row.employee_id ?? null,
						employeeName,
						benefitId: row.benefit_id ?? null,
						benefitName,
						action: row.action,
						detail: row.detail,
						performedByEmployeeId: row.performed_by_employee_id ?? null,
						performedBy: row.performed_by_label,
						metadataJson: mapMetadataJson(row.metadata_json),
						createdAt: row.created_at,
					};
				})
				.filter((row) => {
					if (normalizedAction && row.action.toLowerCase() !== normalizedAction) {
						return false;
					}

					if (!normalizedSearch) {
						return true;
					}

					return [
						row.employeeName,
						row.benefitName,
						row.action,
						row.detail,
						row.performedBy,
					]
						.filter((value): value is string => Boolean(value))
						.some((value) => value.toLowerCase().includes(normalizedSearch));
				})
				.slice(0, limit);
		},
	},
};
