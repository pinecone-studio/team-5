import { Hono } from 'hono';
import { yoga } from './server';
import { employees } from './mockEmployees/employees';
import { employeeTimeData } from './mockEmployees/employee-time-data';
import { createClerkClient } from '@clerk/backend';
import { cors } from 'hono/cors';

interface Env {
	DB: D1Database;
	CLERK_SECRET_KEY: string;
	CLERK_PUBLISHABLE_KEY: string;
	CLERK_JWT_KEY: string;
	FRONTEND_ORIGIN: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use(
	'/graphql',
	cors({
		origin: (origin, c) => origin === c.env.FRONTEND_ORIGIN ? origin : c.env.FRONTEND_ORIGIN,
		allowHeaders: ['Content-Type', 'Authorization'],
		allowMethods: ['GET', 'POST', 'OPTIONS'],
	}),
);
const clerkAuth = async (c: any, next: any) => {
	const clerk = createClerkClient({
		secretKey: c.env.CLERK_SECRET_KEY,
		publishableKey: c.env.CLERK_PUBLISHABLE_KEY,
	});

	const state = await clerk.authenticateRequest(c.req.raw, {
		jwtKey: c.env.CLERK_JWT_KEY,
		authorizedParties: [c.env.FRONTEND_ORIGIN],
	});

	if (!state.isAuthenticated) {
		return c.json({ error: 'Unauthorized' }, 401);
	}

	c.set('auth', state.toAuth());
	await next();
};

app.use('/graphql', clerkAuth);
app.use('/employees', clerkAuth);
app.use('/employee-time-data', clerkAuth);
app.get('/', (c) => c.text('Hello, World!'));

app.all('/graphql', (c) => yoga.fetch(c.req.raw, { env: c.env }));

app.get('/employees', (c) => {
	return c.json(employees);
});

app.get('/employee-time-data', (c) => {
	return c.json(employeeTimeData);
});

export default {
	fetch: app.fetch,
} satisfies ExportedHandler<Env>;
