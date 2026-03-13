import { eq } from "drizzle-orm";

import { getDb } from "../../../db/client";
import { audit_logs } from "../../../db/schemas/audit_log.schema";
import { benefits } from "../../../db/schemas/benefits.schema";
import { employee } from "../../../db/schemas/employee.schema";

type Db = ReturnType<typeof getDb>;

export type AuditLogInsertInput = {
	employeeId?: string | null;
	benefitId?: string | null;
	action: string;
	detail: string;
	performedByEmployeeId?: string | null;
	performedByLabel: string;
	metadata?: Record<string, unknown> | null;
	createdAt?: string;
};

export const SYSTEM_AUDIT_ACTOR = "System";

export async function getEmployeeName(
	db: Db,
	employeeId?: string | null,
): Promise<string | null> {
	if (!employeeId) return null;

	const row = await db
		.select({ fullName: employee.full_name })
		.from(employee)
		.where(eq(employee.id, employeeId))
		.get();

	return row?.fullName ?? null;
}

export async function getBenefitName(
	db: Db,
	benefitId?: string | null,
): Promise<string | null> {
	if (!benefitId) return null;

	const row = await db
		.select({ name: benefits.name })
		.from(benefits)
		.where(eq(benefits.id, benefitId))
		.get();

	return row?.name ?? null;
}

export async function resolvePerformedByLabel(
	db: Db,
	performedByEmployeeId?: string | null,
	fallbackLabel = SYSTEM_AUDIT_ACTOR,
): Promise<string> {
	const employeeName = await getEmployeeName(db, performedByEmployeeId);
	return employeeName ?? fallbackLabel;
}

export async function writeAuditLog(db: Db, input: AuditLogInsertInput) {
	const inserted = await db
		.insert(audit_logs)
		.values({
			employee_id: input.employeeId ?? null,
			benefit_id: input.benefitId ?? null,
			action: input.action,
			detail: input.detail,
			performed_by_employee_id: input.performedByEmployeeId ?? null,
			performed_by_label: input.performedByLabel,
			metadata_json: input.metadata ?? null,
			created_at: input.createdAt ?? new Date().toISOString(),
		})
		.returning()
		.get();

	return inserted;
}
