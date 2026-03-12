import { eq } from 'drizzle-orm';
import { getDb } from '../../../db/client';
import { employee } from '../../../db/schemas/employee.schema';

type EmployeeStatus = 'active' | 'terminated' | 'leave' | 'probation';

const mapEmployee = (row: typeof employee.$inferSelect) => ({
	id: row.id,
	fullName: row.full_name,
	email: row.email,
	role: row.role,
	department: row.department,
	responsibilityLevel: row.responsibility_level,
	hireDate: row.hire_date,
	status: row.status,
	okrSubmitted: row.okr_submitted,
	lateCount: row.lateCount ?? 0,
});

export const employeeMutation = {
	Mutation: {
		createEmployee: async (
			_parent: unknown,
			args: {
				fullName: string;
				email: string;
				role: string;
				department: string;
				responsibilty_level: number;
				status?: EmployeeStatus | null;
				hireDate: string;
				lateCount?: number | null;
			},
			context: { env: Env }
		) => {
			const db = getDb(context.env.DB);

			const id = crypto.randomUUID();

			const row = {
				id,
				full_name: args.fullName,
				email: args.email,
				role: args.role,
				department: args.department,
				responsibility_level: args.responsibilty_level,
				hire_date: args.hireDate,
				status: args.status ?? 'active',
				okr_submitted: 0,
				lateCount: args.lateCount ?? 0,
				lateCount_updated_at: null,
				createdAt: new Date().toISOString(),
				updatedAt: null,
			};

			const inserted = await db.insert(employee).values(row).returning().get();

			return mapEmployee(inserted);
		},

		updateEmployee: async (
			_parent: unknown,
			args: {
				id: string;
				fullName?: string | null;
				status?: EmployeeStatus | null;
				okrSubmitted?: number;
				lateCount?: number | null;
			},
			context: { env: Env }
		) => {
			const db = getDb(context.env.DB);

			const updated = await db
				.update(employee)
				.set({
					...(args.fullName != null ? { full_name: args.fullName } : {}),
					...(args.status != null ? { status: args.status } : {}),
					...(args.okrSubmitted !== undefined ? { okr_submitted: args.okrSubmitted } : {}),
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
