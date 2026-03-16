import { createClerkClient } from '@clerk/backend';
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
	};
	clerkUserId?: string | null;
	clerkEmail?: string | null;
	clerkRole?: AppRole | null;
	clerkDisplayName?: string | null;
};

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

export async function requireAuthenticatedEmployee(context: ResolverContext) {
	const clerkUserId = requireClerkUserId(context);
	let email = context.clerkEmail?.trim() ?? null;
	let displayName = context.clerkDisplayName?.trim() ?? null;

	if (!email) {
		const user = await getClerkUser(context);
		email = getPrimaryClerkEmail(user);
		displayName = getClerkDisplayName(user);
	}

	if (!email) {
		throw new Error('Authenticated Clerk user does not have an email address.');
	}

	const db = getDb(context.env.DB);
	const employeeRow = await db
		.select()
		.from(employee)
		.where(eq(employee.email, email))
		.get();

	if (!employeeRow) {
		throw new Error(
			`No employee record is mapped to Clerk email ${email}. Seed employee.email before using employee portal queries.`,
		);
	}

	return {
		clerkUserId,
		clerkEmail: email,
		clerkRole: context.clerkRole ?? 'employee',
		clerkDisplayName: displayName ?? email.split('@')[0] ?? 'Employee',
		employee: employeeRow,
	};
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
