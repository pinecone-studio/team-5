import { eq } from 'drizzle-orm';
import { getDb } from '../../../db/client';
import { employee } from '../../../db/schemas/employee.schema';

type EmployeeStatus = 'active' | 'terminated' | 'leave' | 'probation';
type EmployeeOkrStatus = 'submitted' | 'success' | 'fail';

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
		(row.okr_status === 'submitted' || row.okr_status === 'success'),
	lateCount: row.late_arrival_count ?? row.lateCount ?? 0,
	lateArrivalCount: row.late_arrival_count ?? row.lateCount ?? 0,
	lateArrivalUpdatedAt: row.late_arrival_updated_at ?? null,
	employeeCode: row.employee_code ?? null,
	createdAt: row.created_at,
	updatedAt: row.updated_at,
});

export const employeeMutation = {
	Mutation: {
		createEmployee: async (
			_parent: unknown,
			args: {
				fullName: string;
				name?: string | null;
				email?: string | null;
				nameEng?: string | null;
				role?: string | null;
				department?: string | null;
				responsibilityLevel?: number | null;
				status?: EmployeeStatus | null;
				employmentStatus?: EmployeeStatus | null;
				hireDate?: string | null;
				okrStatus?: EmployeeOkrStatus | null;
				okrSubmitted?: boolean | null;
				lateCount?: number | null;
				lateArrivalCount?: number | null;
				lateArrivalUpdatedAt?: string | null;
				employeeCode?: string | null;
			},
			context: { env: Env },
		) => {
			const db = getDb(context.env.DB);
			const now = new Date().toISOString();
			const fullName = args.name ?? args.fullName;
			const employmentStatus = args.employmentStatus ?? args.status ?? 'active';
			const okrStatus =
				args.okrStatus ??
				(args.okrSubmitted === true ? 'submitted' : args.okrSubmitted === false ? null : null);
			const okrSubmitted =
				args.okrSubmitted ??
				(args.okrStatus != null
					? args.okrStatus === 'submitted' || args.okrStatus === 'success'
					: false);
			const lateArrivalCount = args.lateArrivalCount ?? args.lateCount ?? 0;
			const lateArrivalUpdatedAt =
				args.lateArrivalUpdatedAt ??
				(args.lateArrivalCount !== undefined || args.lateCount !== undefined ? now : null);

			const inserted = await db
				.insert(employee)
				.values({
					full_name: fullName,
					email: args.email ?? null,
					name_eng: args.nameEng ?? null,
					role: args.role ?? null,
					department: args.department ?? null,
					responsibility_level: args.responsibilityLevel ?? 0,
					status: employmentStatus,
					employment_status: employmentStatus,
					hire_date: args.hireDate ?? null,
					okr_status: okrStatus,
					okr_submitted: okrSubmitted,
					lateCount: lateArrivalCount,
					late_arrival_count: lateArrivalCount,
					late_arrival_updated_at: lateArrivalUpdatedAt,
					employee_code: args.employeeCode ?? null,
					created_at: now,
					updated_at: now,
				})
				.returning()
				.get();

			return mapEmployee(inserted);
		},

		updateEmployee: async (
			_parent: unknown,
			args: {
				id: string;
				fullName?: string | null;
				name?: string | null;
				email?: string | null;
				nameEng?: string | null;
				role?: string | null;
				department?: string | null;
				responsibilityLevel?: number | null;
				status?: EmployeeStatus | null;
				employmentStatus?: EmployeeStatus | null;
				hireDate?: string | null;
				okrStatus?: EmployeeOkrStatus | null;
				okrSubmitted?: boolean | null;
				lateCount?: number | null;
				lateArrivalCount?: number | null;
				lateArrivalUpdatedAt?: string | null;
				employeeCode?: string | null;
			},
			context: { env: Env },
		) => {
			const db = getDb(context.env.DB);
			const now = new Date().toISOString();
			const fullName = args.name ?? args.fullName;
			const employmentStatus = args.employmentStatus ?? args.status;
			const lateArrivalCount = args.lateArrivalCount ?? args.lateCount;
			const okrStatus =
				args.okrStatus !== undefined
					? args.okrStatus
					: args.okrSubmitted !== undefined
						? args.okrSubmitted
							? 'submitted'
							: null
						: undefined;
			const okrSubmitted =
				args.okrSubmitted !== undefined
					? args.okrSubmitted
					: args.okrStatus !== undefined && args.okrStatus !== null
						? args.okrStatus === 'submitted' || args.okrStatus === 'success'
						: args.okrStatus === null
							? false
							: undefined;

			const updated = await db
				.update(employee)
				.set({
					...(fullName != null ? { full_name: fullName } : {}),
					...(args.email !== undefined ? { email: args.email } : {}),
					...(args.nameEng !== undefined ? { name_eng: args.nameEng } : {}),
					...(args.role !== undefined ? { role: args.role } : {}),
					...(args.department !== undefined ? { department: args.department } : {}),
					...(args.responsibilityLevel != null
						? { responsibility_level: args.responsibilityLevel }
						: {}),
					...(employmentStatus != null
						? {
								status: employmentStatus,
								employment_status: employmentStatus,
							}
						: {}),
					...(args.hireDate !== undefined ? { hire_date: args.hireDate } : {}),
					...(okrStatus !== undefined ? { okr_status: okrStatus } : {}),
					...(okrSubmitted !== undefined ? { okr_submitted: okrSubmitted } : {}),
					...(lateArrivalCount != null
						? {
								lateCount: lateArrivalCount,
								late_arrival_count: lateArrivalCount,
							}
						: {}),
					...(args.lateArrivalUpdatedAt !== undefined
						? { late_arrival_updated_at: args.lateArrivalUpdatedAt }
						: lateArrivalCount != null
							? { late_arrival_updated_at: now }
							: {}),
					...(args.employeeCode !== undefined ? { employee_code: args.employeeCode } : {}),
					updated_at: now,
				})
				.where(eq(employee.id, args.id))
				.returning()
				.get();

			if (!updated) {
				throw new Error('Employee not found');
			}

			return mapEmployee(updated);
		},

		deleteEmployee: async (_parent: unknown, args: { id: string }, context: { env: Env }) => {
			const db = getDb(context.env.DB);

			const deleted = await db.delete(employee).where(eq(employee.id, args.id)).returning().get();

			return !!deleted;
		},
	},
};
