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
		CLERK_SECRET_KEY?: string;
		CLERK_PUBLISHABLE_KEY?: string;
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

function isLocalFrontendOrigin(frontendOrigin?: string): boolean {
	return (frontendOrigin ?? '')
		.split(',')
		.map((value) => value.trim())
		.some(
			(value) => value === 'http://localhost:3000' || value === 'http://127.0.0.1:3000',
		);
}

function requireClerkUserId(context: ResolverContext): string {
	if (!context.clerkUserId) {
		throw new Error('Authenticated user context is missing.');
	}

	return context.clerkUserId;
}

function getClerkClient(context: ResolverContext) {
	return createClerkClient({
		secretKey: context.env.CLERK_SECRET_KEY!,
		publishableKey: context.env.CLERK_PUBLISHABLE_KEY!,
	});
}

async function getClerkUser(context: ResolverContext) {
	const clerkUserId = requireClerkUserId(context);
	const clerk = getClerkClient(context);
	return clerk.users.getUser(clerkUserId);
}

function requireClerkEmail(context: ResolverContext): string | null {
	const email = context.clerkEmail?.trim();
	return email && email.length > 0 ? email : null;
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

	return getPrimaryClerkEmail(user)?.split('@')[0] ?? 'Employee';
}

export async function requireAuthenticatedEmployee(
	context: ResolverContext,
): Promise<AuthenticatedEmployee> {
	const clerkUserId = requireClerkUserId(context);
	let email = requireClerkEmail(context);
	let displayName = context.clerkDisplayName?.trim() ?? null;

	if (!email) {
		const user = await getClerkUser(context);
		email = getPrimaryClerkEmail(user);
		displayName = getClerkDisplayName(user);
	}

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
			clerkEmail: email,
			clerkRole: context.clerkRole ?? 'employee',
			clerkDisplayName: displayName ?? email.split('@')[0] ?? 'Local Employee',
			employee: employeeRow,
		};
	}

	if (isLocalFrontendOrigin(context.env.FRONTEND_ORIGIN)) {
		const localEmployee = await db
			.insert(employee)
			.values({
				full_name: displayName ?? email.split('@')[0] ?? 'Local Employee',
				email,
				status: 'active',
				employment_status: 'active',
			})
			.returning()
			.get();

		return {
			clerkUserId,
			clerkEmail: email,
			clerkRole: context.clerkRole ?? 'employee',
			clerkDisplayName: displayName ?? email.split('@')[0] ?? 'Local Employee',
			employee: localEmployee,
		};
	}

	throw new Error(
		`No employee record is mapped to Clerk email ${email}. Seed employee.email before using employee portal queries.`,
	);
}

export async function requireManagerAccess(context: ResolverContext) {
	const auth = await requireAuthenticatedEmployee(context);

	if (!isManagerRole(auth.clerkRole)) {
		throw new Error('Forbidden: HR or admin access is required.');
	}

	return auth;
}

export async function requireBenefitRequestReviewerAccess(context: ResolverContext) {
	const auth = await requireAuthenticatedEmployee(context);

	if (!canReviewBenefitRequests(auth.clerkRole)) {
		throw new Error('Forbidden: reviewer access is required.');
	}

	return auth;
}
