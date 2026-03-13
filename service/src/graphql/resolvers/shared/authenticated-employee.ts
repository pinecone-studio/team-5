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

function requireClerkUserId(context: ResolverContext): string {
	if (!context.clerkUserId) {
		throw new Error('Authenticated user context is missing.');
	}

	return context.clerkUserId;
}

export async function requireAuthenticatedEmployee(context: ResolverContext) {
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

	if (!employeeRow) {
		throw new Error(
			`No employee record is mapped to Clerk email ${email}. Seed employee.email before using employee portal queries.`,
		);
	}

	return {
		clerkUserId,
		clerkEmail: email,
		employee: employeeRow,
	};
}
