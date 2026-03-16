import { eq } from 'drizzle-orm';

import { getDb } from '../../../db/client';
import { employee } from '../../../db/schemas/employee.schema';
import {
	canReviewBenefitRequests,
	isManagerRole,
	type AppRole,
} from './access-control';

type ClerkLikeUser = {
	fullName?: string | null;
	firstName?: string | null;
	lastName?: string | null;
	primaryEmailAddress?: { emailAddress?: string | null } | null;
	emailAddresses?: Array<{ emailAddress?: string | null }>;
};

export type ResolverContext = {
	env: {
		DB: D1Database;
		FRONTEND_ORIGIN?: string;
	};
	clerkUserId?: string | null;
	clerkEmail?: string | null;
	clerkRole?: AppRole | null;
	clerkDisplayName?: string | null;
};

export type AuthenticatedEmployee = {
	clerkUserId: string;
	clerkEmail: string;
	clerkRole: AppRole;
	clerkDisplayName: string;
	employee: typeof employee.$inferSelect;
};

function requireClerkUserId(context: ResolverContext): string {
	if (!context.clerkUserId) {
		throw new Error('Authenticated user context is missing.');
	}

	return context.clerkUserId;
}

function requireClerkEmail(context: ResolverContext): string {
	const email = context.clerkEmail?.trim();

	if (!email) {
		throw new Error('Authenticated Clerk user does not have an email address.');
	}

	return email;
}

function isLocalFrontendOrigin(frontendOrigin?: string): boolean {
	return (frontendOrigin ?? '')
		.split(',')
		.map((value) => value.trim())
		.some(
			(value) => value === 'http://localhost:3000' || value === 'http://127.0.0.1:3000',
		);
}

export function getPrimaryClerkEmail(user: ClerkLikeUser): string | null {
	return user.primaryEmailAddress?.emailAddress ?? user.emailAddresses?.[0]?.emailAddress ?? null;
}

export function getClerkDisplayName(user: ClerkLikeUser): string {
	const fullName = user.fullName?.trim();

	if (fullName) {
		return fullName;
	}

	const firstLast = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();

	if (firstLast) {
		return firstLast;
	}

	return getPrimaryClerkEmail(user)?.split('@')[0] ?? 'Local Employee';
}

export async function requireAuthenticatedEmployee(
	context: ResolverContext,
): Promise<AuthenticatedEmployee> {
	const clerkUserId = requireClerkUserId(context);
	const clerkEmail = requireClerkEmail(context);
	const clerkRole = context.clerkRole ?? 'employee';
	const clerkDisplayName = context.clerkDisplayName?.trim() || clerkEmail.split('@')[0] || 'Local Employee';

	const db = getDb(context.env.DB);
	const employeeRow = await db
		.select()
		.from(employee)
		.where(eq(employee.email, clerkEmail))
		.get();

	if (employeeRow) {
		return {
			clerkUserId,
			clerkEmail,
			clerkRole,
			clerkDisplayName,
			employee: employeeRow,
		};
	}

	if (isLocalFrontendOrigin(context.env.FRONTEND_ORIGIN)) {
		const localEmployee = await db
			.insert(employee)
			.values({
				full_name: clerkDisplayName,
				email: clerkEmail,
				status: 'active',
				employment_status: 'active',
			})
			.returning()
			.get();

		return {
			clerkUserId,
			clerkEmail,
			clerkRole,
			clerkDisplayName,
			employee: localEmployee,
		};
	}

	throw new Error(
		`No employee record is mapped to Clerk email ${clerkEmail}. Seed employee.email before using employee portal queries.`,
	);
}

export async function requireManagerAccess(
	context: ResolverContext,
): Promise<AuthenticatedEmployee> {
	const auth = await requireAuthenticatedEmployee(context);

	// if (!isManagerRole(auth.clerkRole)) {
	// 	throw new Error('Forbidden: HR or admin access is required.');
	// }

	return auth;
}

export async function requireHrAdminAccess(
	context: ResolverContext,
): Promise<AuthenticatedEmployee> {
	const auth = await requireAuthenticatedEmployee(context);

	if (auth.clerkRole !== 'hr' && auth.clerkRole !== 'admin') {
		throw new Error('Forbidden: HR admin access is required.');
	}

	return auth;
}

export async function requireBenefitRequestReviewerAccess(
	context: ResolverContext,
): Promise<AuthenticatedEmployee> {
	const auth = await requireAuthenticatedEmployee(context);

	if (!canReviewBenefitRequests(auth.clerkRole)) {
		throw new Error('Forbidden: reviewer access is required.');
	}

	return auth;
}
