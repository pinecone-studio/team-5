import { createClerkClient } from '@clerk/backend';
import { eq } from 'drizzle-orm';

import { getDb } from '../../../db/client';
import { employee } from '../../../db/schemas/employee.schema';

type ResolverContext = {
	env: {
		DB: D1Database;
		CLERK_SECRET_KEY?: string;
		CLERK_PUBLISHABLE_KEY?: string;
	};
	clerkUserId?: string | null;
};

export type ApplicationRole = 'employee' | 'hr_admin' | 'finance_manager';

function requireClerkUserId(context: ResolverContext): string {
	if (!context.clerkUserId) {
		throw new Error('Authenticated user context is missing.');
	}

	return context.clerkUserId;
}

export function normalizeApplicationRole(role: unknown): ApplicationRole {
	if (
		role === 'admin' ||
		role === 'hr' ||
		role === 'hr_admin'
	) {
		return 'hr_admin';
	}

	if (role === 'finance' || role === 'finance_manager') {
		return 'finance_manager';
	}

	return 'employee';
}

export async function resolveAuthenticatedSession(context: ResolverContext) {
	const clerkUserId = requireClerkUserId(context);
	const clerk = createClerkClient({
		secretKey: context.env.CLERK_SECRET_KEY!,
		publishableKey: context.env.CLERK_PUBLISHABLE_KEY!,
	});

	const user = await clerk.users.getUser(clerkUserId);
	const email =
		user.primaryEmailAddress?.emailAddress ??
		user.emailAddresses[0]?.emailAddress ??
		null;

	if (!email) {
		throw new Error('Authenticated Clerk user does not have an email address.');
	}

	const db = getDb(context.env.DB);
	const employeeRow = await db
		.select()
		.from(employee)
		.where(eq(employee.email, email))
		.get();

	const role = normalizeApplicationRole(
		user.publicMetadata?.role ?? employeeRow?.role,
	);

	return {
		clerkUserId,
		clerkEmail: email,
		clerkUser: user,
		employee: employeeRow ?? null,
		role,
	};
}

export async function requireAuthenticatedEmployee(context: ResolverContext) {
	const session = await resolveAuthenticatedSession(context);

	if (!session.employee) {
		throw new Error(
			`No employee record is mapped to Clerk email ${session.clerkEmail}. Seed employee.email before using employee portal queries.`,
		);
	}

	return {
		...session,
		employee: session.employee,
	};
}

export async function requireManagerAccess(context: ResolverContext) {
	const session = await resolveAuthenticatedSession(context);

	if (session.role === 'employee') {
		throw new Error('Manager access is required for this operation.');
	}

	return session;
}

export async function requireHrAdminAccess(context: ResolverContext) {
	const session = await resolveAuthenticatedSession(context);

	if (session.role !== 'hr_admin') {
		throw new Error('HR admin access is required for this operation.');
	}

	return session;
}
