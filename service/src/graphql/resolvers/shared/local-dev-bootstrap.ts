import { benefits } from '../../../db/schemas/benefits.schema';
import { getDb } from '../../../db/client';

type DbClient = ReturnType<typeof getDb>;

const LOCAL_FRONTEND_ORIGINS = new Set([
	'http://localhost:3000',
	'http://127.0.0.1:3000',
]);

const LOCAL_BENEFIT_SEED: Array<typeof benefits.$inferInsert> = [
	{
		id: 'local-private-insurance',
		name: 'Private Insurance',
		category: 'health',
		subsidy_percent: 100,
		vendor_name: 'Pine Benefits',
		requires_contract: false,
		is_active: true,
	},
	{
		id: 'local-digital-wellness',
		name: 'Digital Wellness',
		category: 'wellness',
		subsidy_percent: 50,
		vendor_name: 'Mind Balance',
		requires_contract: false,
		is_active: true,
	},
	{
		id: 'local-gym-pinefit',
		name: 'Gym - Pinefit',
		category: 'wellness',
		subsidy_percent: 50,
		vendor_name: 'PineFit',
		requires_contract: false,
		is_active: true,
	},
	{
		id: 'local-remote-work',
		name: 'Remote Work',
		category: 'work',
		subsidy_percent: 100,
		vendor_name: 'Pine Office',
		requires_contract: false,
		is_active: true,
	},
	{
		id: 'local-bonus-okr-based',
		name: 'Bonus (OKR-based)',
		category: 'performance',
		subsidy_percent: 100,
		vendor_name: 'Pine Payroll',
		requires_contract: false,
		is_active: true,
	},
	{
		id: 'local-extra-responsibility',
		name: 'Extra Responsibility',
		category: 'career',
		subsidy_percent: 100,
		vendor_name: 'Pine Career',
		requires_contract: false,
		is_active: true,
	},
];

function isLocalFrontendOrigin(frontendOrigin?: string): boolean {
	return (frontendOrigin ?? '')
		.split(',')
		.map((value) => value.trim())
		.some((value) => LOCAL_FRONTEND_ORIGINS.has(value));
}

export async function ensureLocalBenefitsSeeded(
	db: DbClient,
	frontendOrigin?: string,
): Promise<void> {
	if (!isLocalFrontendOrigin(frontendOrigin)) {
		return;
	}

	const existingBenefit = await db.select({ id: benefits.id }).from(benefits).get();

	if (existingBenefit) {
		return;
	}

	await db.insert(benefits).values(LOCAL_BENEFIT_SEED);
}
