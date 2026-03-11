import { eq } from 'drizzle-orm';
import { getDb } from '../../../db/client';
import { employee } from '../../../db/schemas/employee.schema';

type EmployeeStatus = 'active' | 'terminated' | 'leave' | 'probation';
type EmployeeOkrStatus = 'submitted' | 'success' | 'fail';

const mapEmployee = (row: typeof employee.$inferSelect) => ({
	id: row.id,
	fullName: row.full_name,
	status: row.status,
	okrStatus: row.okr_status,
	lateCount: row.lateCount ?? 0,
});

export const employeeMutation = {
	Mutation: {
		createEmployee: async (
			_parent: unknown,
			args: {
				fullName: string;
				status?: EmployeeStatus | null;
				okrStatus?: EmployeeOkrStatus | null;
				lateCount?: number | null;
			},
			context: { env: Env },
		) => {
			const db = getDb(context.env.DB);

			const inserted = await db
				.insert(employee)
				.values({
					full_name: args.fullName,
					status: args.status ?? 'active',
					okr_status: args.okrStatus ?? null,
					lateCount: args.lateCount ?? 0,
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
				status?: EmployeeStatus | null;
				okrStatus?: EmployeeOkrStatus | null;
				lateCount?: number | null;
			},
			context: { env: Env },
		) => {
			const db = getDb(context.env.DB);

			const updated = await db
				.update(employee)
				.set({
					...(args.fullName != null ? { full_name: args.fullName } : {}),
					...(args.status != null ? { status: args.status } : {}),
					...(args.okrStatus !== undefined ? { okr_status: args.okrStatus } : {}),
					...(args.lateCount != null ? { lateCount: args.lateCount } : {}),
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
