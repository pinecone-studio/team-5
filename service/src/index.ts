import { createClerkClient } from '@clerk/backend';
import { Hono } from 'hono';
import type { MiddlewareHandler } from 'hono';
import { cors } from 'hono/cors';

import {
	getClerkDisplayName,
	getPrimaryClerkEmail,
} from './graphql/resolvers/shared/authenticated-employee';
import {
	isManagerRole,
	normalizeClerkRole,
	type AppRole,
} from './graphql/resolvers/shared/access-control';
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
		clerkEmail: string | null;
		clerkRole: AppRole;
		clerkDisplayName: string | null;
	};
};

const app = new Hono<AppContext>();

const LOCAL_FRONTEND_ORIGINS = [
	'http://localhost:3000',
	'http://127.0.0.1:3000',
];

function getConfiguredFrontendOrigins(env: Env): string[] {
	return (env.FRONTEND_ORIGIN ?? '')
		.split(',')
		.map((value) => value.trim())
		.filter((value) => value.length > 0);
}

function isLocalFrontendOrigin(origin: string): boolean {
	return LOCAL_FRONTEND_ORIGINS.includes(origin);
}

function getAllowedFrontendOrigins(env: Env, requestOrigin?: string | null): string[] {
	const configuredOrigins = getConfiguredFrontendOrigins(env);

	if (requestOrigin && isLocalFrontendOrigin(requestOrigin)) {
		return [...new Set([...configuredOrigins, requestOrigin, ...LOCAL_FRONTEND_ORIGINS])];
	}

	return configuredOrigins;
}

app.use(
	'*',
	cors({
		origin: (origin, c) => {
			if (!origin) return '*';

			const allowedOrigins = getAllowedFrontendOrigins(c.env, origin);
			return allowedOrigins.includes(origin) ? origin : allowedOrigins[0] ?? 'null';
		},
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
	const requestOrigin = c.req.header('Origin');

	const authState = await clerk.authenticateRequest(c.req.raw, {
		acceptsToken: 'session_token',
		authorizedParties: getAllowedFrontendOrigins(c.env, requestOrigin),
		...(c.env.CLERK_JWT_KEY ? { jwtKey: c.env.CLERK_JWT_KEY } : {}),
	});

	if (!authState.isAuthenticated) {
		const response = c.json({ error: 'Unauthorized' }, 401);
		authState.headers.forEach((value, key) => {
			response.headers.set(key, value);
		});
		return response;
	}

	const auth = authState.toAuth();
	const userId = auth.userId;

	if (!userId) {
		return c.json({ error: 'Unauthorized' }, 401);
	}

	const user = await clerk.users.getUser(userId);

	c.set('clerkUserId', userId);
	c.set('clerkEmail', getPrimaryClerkEmail(user));
	c.set('clerkRole', normalizeClerkRole(user.publicMetadata?.role));
	c.set('clerkDisplayName', getClerkDisplayName(user));
	await next();
};

const requireManagerRole: MiddlewareHandler<AppContext> = async (c, next) => {
	if (!isManagerRole(c.get('clerkRole'))) {
		return c.json({ error: 'Forbidden' }, 403);
	}

	await next();
};

app.all('/graphql', requireClerkAuth, (c) =>
	yoga.fetch(c.req.raw, {
		env: c.env,
		clerkUserId: c.get('clerkUserId'),
		clerkEmail: c.get('clerkEmail'),
		clerkRole: c.get('clerkRole'),
		clerkDisplayName: c.get('clerkDisplayName'),
	}),
);

app.get('/employees', requireClerkAuth, requireManagerRole, (c) => {
	return c.json(employees);
});

app.get('/employee-time-data', requireClerkAuth, requireManagerRole, (c) => {
	return c.json(employeeTimeData);
});

export default {
	fetch: app.fetch,
} satisfies ExportedHandler<Env>;
