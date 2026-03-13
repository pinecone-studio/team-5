import { createClerkClient } from '@clerk/backend';
import { Hono } from 'hono';
import type { MiddlewareHandler } from 'hono';
import { cors } from 'hono/cors';

import { yoga } from './server';
import { employees } from './mockEmployees/employees';
import { employeeTimeData } from './mockEmployees/employee-time-data';

interface Env {
	DB: D1Database;
	CLERK_SECRET_KEY?: string;
	CLERK_PUBLISHABLE_KEY?: string;
	CLERK_JWT_KEY?: string;
	FRONTEND_ORIGIN?: string;
}

type AppContext = {
	Bindings: Env;
	Variables: {
		clerkUserId: string | null;
	};
};

const app = new Hono<AppContext>();

app.use(
	'*',
	cors({
		origin: (origin, c) => c.env.FRONTEND_ORIGIN ?? origin ?? '*',
		allowHeaders: ['Authorization', 'Content-Type'],
		allowMethods: ['GET', 'POST', 'OPTIONS'],
	})
);

app.get('/', (c) => c.text('Hello, World!'));

function getMissingClerkKeys(env: Env): string[] {
	return [
		env.CLERK_SECRET_KEY ? null : 'CLERK_SECRET_KEY',
		env.CLERK_PUBLISHABLE_KEY ? null : 'CLERK_PUBLISHABLE_KEY',
		env.FRONTEND_ORIGIN ? null : 'FRONTEND_ORIGIN',
	].filter((value): value is string => value != null);
}

const requireClerkAuth: MiddlewareHandler<AppContext> = async (c, next) => {
	const missingClerkKeys = getMissingClerkKeys(c.env);

	if (missingClerkKeys.length > 0) {
		return c.json(
			{
				error: 'Missing Clerk configuration',
				missingKeys: missingClerkKeys,
			},
			503
		);
	}

	const clerk = createClerkClient({
		secretKey: c.env.CLERK_SECRET_KEY!,
		publishableKey: c.env.CLERK_PUBLISHABLE_KEY!,
	});

	const authState = await clerk.authenticateRequest(c.req.raw, {
		acceptsToken: 'session_token',
		authorizedParties: [c.env.FRONTEND_ORIGIN!],
		...(c.env.CLERK_JWT_KEY ? { jwtKey: c.env.CLERK_JWT_KEY } : {}),
	});

	if (!authState.isAuthenticated) {
		const response = c.json({ error: 'Unauthorized' }, 401);
		authState.headers.forEach((value, key) => {
			response.headers.set(key, value);
		});
		return response;
	}

	c.set('clerkUserId', authState.toAuth().userId);
	await next();
};

app.all('/graphql', requireClerkAuth, (c) =>
	yoga.fetch(c.req.raw, { env: c.env, clerkUserId: c.get('clerkUserId') }),
);

app.get('/employees', requireClerkAuth, (c) => {
	return c.json(employees);
});

app.get('/employee-time-data', requireClerkAuth, (c) => {
	return c.json(employeeTimeData);
});

export default {
	fetch: app.fetch,
} satisfies ExportedHandler<Env>;
