import { and, desc, eq } from 'drizzle-orm';

import { getDb } from '../../db/client';
import { benefits } from '../../db/schemas/benefits.schema';
import { benefit_eligibility } from '../../db/schemas/benefit_eligibility.schema';
import { benefit_requests } from '../../db/schemas/benefit_request.schema';
import { contracts } from '../../db/schemas/contract.schema';
import { employee } from '../../db/schemas/employee.schema';
import { recomputeBenefitEligibility } from './shared/benefit-eligibility-engine';
import { requireAuthenticatedEmployee } from './shared/authenticated-employee';
import { writeAuditLog } from './shared/audit-log';
import { ensureBenefitRequestSchema } from './shared/benefit-request-schema';
import { findActiveContractForBenefit } from './shared/contract-lifecycle';
import { ensureLocalBenefitsSeeded } from './shared/local-dev-bootstrap';

type ResolverContext = {
	env: {
		DB: D1Database;
		CLERK_SECRET_KEY?: string;
		CLERK_PUBLISHABLE_KEY?: string;
		FRONTEND_ORIGIN?: string;
	};
	clerkUserId?: string | null;
};

type EmployeeRow = typeof employee.$inferSelect;
type BenefitRow = typeof benefits.$inferSelect;
type EligibilityRow = typeof benefit_eligibility.$inferSelect;
type BenefitRequestRow = typeof benefit_requests.$inferSelect;
type ContractRow = typeof contracts.$inferSelect;

const mapEmployee = (row: EmployeeRow) => ({
	id: row.id,
	fullName: row.full_name,
	name: row.full_name,
	email: row.email ?? null,
	nameEng: row.name_eng ?? null,
	role: row.role ?? null,
	department: row.department ?? null,
	responsibilityLevel: row.responsibility_level ?? 0,
	status: row.employment_status ?? row.status,
	employmentStatus: row.employment_status ?? row.status,
	hireDate: row.hire_date ?? null,
	okrStatus: row.okr_status,
	okrSubmitted:
		row.okr_submitted ??
		(row.okr_status === 'submitted' || row.okr_status === 'success'),
	lateCount: row.late_arrival_count ?? row.lateCount ?? 0,
	lateArrivalCount: row.late_arrival_count ?? row.lateCount ?? 0,
	lateArrivalUpdatedAt: row.late_arrival_updated_at ?? null,
	employeeCode: row.employee_code ?? null,
	createdAt: row.created_at,
	updatedAt: row.updated_at,
});

const mapBenefit = (row: BenefitRow) => ({
	id: row.id,
	name: row.name,
	category: row.category ?? null,
	subsidyPercent: row.subsidy_percent,
	vendorName: row.vendor_name ?? null,
	requiresContract: row.requires_contract ?? false,
	activeContractId: row.active_contract_id ?? null,
	isActive: row.is_active ?? false,
});

const mapEligibility = (row: EligibilityRow) => ({
	employeeId: row.employee_id,
	benefitId: row.benefit_id,
	status: row.status,
	ruleEvaluationJson: JSON.stringify(row.rule_evaluation_json),
	computedAt: row.computed_at,
	overrideBy: row.override_by ?? null,
	overrideReason: row.override_reason ?? null,
	overrideExpiresAt: row.override_expires_at ?? null,
});

const mapRequest = (row: BenefitRequestRow) => ({
	id: row.id,
	employeeId: row.employee_id,
	benefitId: row.benefit_id,
	status: row.status,
	contractVersionAccepted: row.contract_version_accepted,
	contractAcceptedAt: row.contract_accepted_at,
	reviewNotes: row.review_notes ?? null,
	reviewedBy: row.reviewed_by ?? null,
	createdAt: row.created_at,
	updatedAt: row.updated_at,
});

const mapContract = (row: ContractRow) => ({
	id: row.id,
	benefitId: row.benefit_id,
	vendorName: row.vendor_name,
	version: row.version,
	r2ObjectKey: row.r2_object_key,
	sha256Hash: row.sha256_hash,
	effectiveDate: row.effective_date,
	expiryDate: row.expiry_date,
	isActive: row.is_active ?? false,
});

function getFailureReasons(ruleEvaluationJson: EligibilityRow['rule_evaluation_json']): string[] {
	if (!Array.isArray(ruleEvaluationJson)) return [];

	return ruleEvaluationJson
		.flatMap((item) => {
			if (
				item &&
				typeof item === 'object' &&
				'passed' in item &&
				item.passed === false &&
				'reason' in item &&
				typeof item.reason === 'string' &&
				item.reason.length > 0
			) {
				return [item.reason];
			}

			return [];
		})
		.filter((reason, index, list) => list.indexOf(reason) === index);
}

async function findActiveContract(
	context: ResolverContext,
	benefitRow: BenefitRow,
): Promise<ContractRow | null> {
	return findActiveContractForBenefit(getDb(context.env.DB), benefitRow.id);
}

async function findLatestRequest(
	context: ResolverContext,
	employeeId: string,
	benefitId: string,
): Promise<BenefitRequestRow | null> {
	const db = getDb(context.env.DB);
	await ensureBenefitRequestSchema(context.env.DB);

	return db
		.select()
		.from(benefit_requests)
		.where(
			and(
				eq(benefit_requests.employee_id, employeeId),
				eq(benefit_requests.benefit_id, benefitId),
			),
		)
		.orderBy(desc(benefit_requests.updated_at), desc(benefit_requests.created_at))
		.get()
		.then((row) => row ?? null);
}

function deriveMyBenefitStatus(
	eligibilityRow: EligibilityRow,
	latestRequest: BenefitRequestRow | null,
): 'active' | 'available' | 'pending' | 'locked' {
	if (latestRequest?.status === 'approved') return 'active';
	if (latestRequest?.status === 'pending') return 'pending';
	if (eligibilityRow.status === 'eligible' || eligibilityRow.status === 'active') {
		return 'available';
	}

	return 'locked';
}

async function buildMyBenefit(
	context: ResolverContext,
	employeeId: string,
	benefitRow: BenefitRow,
) {
	const eligibility = await recomputeBenefitEligibility(getDb(context.env.DB), {
		employeeId,
		benefitId: benefitRow.id,
	});
	const [activeContract, latestRequest] = await Promise.all([
		findActiveContract(context, benefitRow),
		findLatestRequest(context, employeeId, benefitRow.id),
	]);
	const status = deriveMyBenefitStatus(eligibility.row, latestRequest);

	return {
		benefit: mapBenefit(benefitRow),
		eligibility: mapEligibility(eligibility.row),
		latestRequest: latestRequest ? mapRequest(latestRequest) : null,
		activeContract: activeContract ? mapContract(activeContract) : null,
		status,
		canRequest:
			status === 'available' &&
			latestRequest?.status !== 'pending' &&
			latestRequest?.status !== 'approved',
		failureReasons: getFailureReasons(eligibility.row.rule_evaluation_json),
	};
}

async function getRequestContext(context: ResolverContext, benefitId: string) {
	const auth = await requireAuthenticatedEmployee(context);
	const db = getDb(context.env.DB);
	const benefitRow = await db
		.select()
		.from(benefits)
		.where(eq(benefits.id, benefitId))
		.get();

	if (!benefitRow || benefitRow.is_active === false) {
		throw new Error('Benefit not found or inactive.');
	}

	const eligibility = await recomputeBenefitEligibility(db, {
		employeeId: auth.employee.id,
		benefitId,
	});
	const [activeContract, latestRequest] = await Promise.all([
		findActiveContract(context, benefitRow),
		findLatestRequest(context, auth.employee.id, benefitId),
	]);

	return {
		auth,
		benefitRow,
		eligibility,
		activeContract,
		latestRequest,
	};
}

export const employeePortalResolvers = {
	Query: {
		me: async (_parent: unknown, _args: unknown, context: ResolverContext) => {
			const auth = await requireAuthenticatedEmployee(context);
			return mapEmployee(auth.employee);
		},

		myBenefits: async (_parent: unknown, _args: unknown, context: ResolverContext) => {
			const auth = await requireAuthenticatedEmployee(context);
			const db = getDb(context.env.DB);
			await ensureLocalBenefitsSeeded(db, context.env.FRONTEND_ORIGIN);
			const benefitRows = await db
				.select()
				.from(benefits)
				.where(eq(benefits.is_active, true))
				.orderBy(desc(benefits.name))
				.all();

			const myBenefits = await Promise.all(
				benefitRows.map((benefitRow) =>
					buildMyBenefit(context, auth.employee.id, benefitRow),
				),
			);

			return myBenefits;
		},

		myRequests: async (_parent: unknown, _args: unknown, context: ResolverContext) => {
			const auth = await requireAuthenticatedEmployee(context);
			const db = getDb(context.env.DB);
			await ensureBenefitRequestSchema(context.env.DB);
			const [requestRows, benefitRows] = await Promise.all([
				db
					.select()
					.from(benefit_requests)
					.where(eq(benefit_requests.employee_id, auth.employee.id))
					.orderBy(desc(benefit_requests.updated_at), desc(benefit_requests.created_at))
					.all(),
				db.select().from(benefits).all(),
			]);

			const benefitMap = new Map(benefitRows.map((row) => [row.id, row] as const));

			return requestRows
				.map((requestRow) => {
					const benefitRow = benefitMap.get(requestRow.benefit_id);

					if (!benefitRow) {
						return null;
					}

					return {
						benefit: mapBenefit(benefitRow),
						request: mapRequest(requestRow),
					};
				})
				.filter((item): item is NonNullable<typeof item> => item != null);
		},
	},

	Mutation: {
		requestBenefit: async (
			_parent: unknown,
			args: { input: { benefitId: string } },
			context: ResolverContext,
		) => {
			const { benefitRow, eligibility, activeContract, latestRequest } =
				await getRequestContext(context, args.input.benefitId);

			if (latestRequest?.status === 'pending') {
				throw new Error('There is already a pending request for this benefit.');
			}

			if (latestRequest?.status === 'approved') {
				throw new Error('This benefit has already been approved for the employee.');
			}

			if (
				eligibility.row.status !== 'eligible' &&
				eligibility.row.status !== 'active'
			) {
				const firstFailure = eligibility.evaluations.find((rule) => !rule.passed);
				throw new Error(
					firstFailure?.reason ??
						'This benefit cannot be requested because eligibility rules are not met.',
				);
			}

			if (benefitRow.requires_contract && !activeContract) {
				throw new Error(
					'This benefit requires an active contract, but no active contract is configured.',
				);
			}

			return {
				benefit: mapBenefit(benefitRow),
				eligibility: mapEligibility(eligibility.row),
				activeContract: activeContract ? mapContract(activeContract) : null,
				existingRequest: latestRequest ? mapRequest(latestRequest) : null,
				requiresContractAcceptance: Boolean(benefitRow.requires_contract),
			};
		},

		confirmBenefitRequest: async (
			_parent: unknown,
			args: {
				input: {
					benefitId: string;
					contractVersionAccepted?: string | null;
					contractAcceptedAt?: string | null;
				};
			},
			context: ResolverContext,
		) => {
			const { auth, benefitRow, eligibility, activeContract, latestRequest } =
				await getRequestContext(context, args.input.benefitId);
			const db = getDb(context.env.DB);
			await ensureBenefitRequestSchema(context.env.DB);

			if (latestRequest?.status === 'pending') {
				throw new Error('There is already a pending request for this benefit.');
			}

			if (latestRequest?.status === 'approved') {
				throw new Error('This benefit has already been approved for the employee.');
			}

			if (
				eligibility.row.status !== 'eligible' &&
				eligibility.row.status !== 'active'
			) {
				const firstFailure = eligibility.evaluations.find((rule) => !rule.passed);
				throw new Error(
					firstFailure?.reason ??
						'This benefit cannot be requested because eligibility rules are not met.',
				);
			}

			if (benefitRow.requires_contract) {
				if (!activeContract) {
					throw new Error(
						'This benefit requires an active contract, but no active contract is configured.',
					);
				}

				if (!args.input.contractVersionAccepted) {
					throw new Error('Contract version acceptance is required for this benefit.');
				}

				if (args.input.contractVersionAccepted !== activeContract.version) {
					throw new Error(
						'Contract version acceptance must match the current active contract version.',
					);
				}
			}

			const inserted = await db
				.insert(benefit_requests)
				.values({
					employee_id: auth.employee.id,
					benefit_id: args.input.benefitId,
					status: 'pending',
					contract_version_accepted: benefitRow.requires_contract
						? args.input.contractVersionAccepted ?? null
						: null,
					contract_accepted_at: benefitRow.requires_contract
						? args.input.contractAcceptedAt ?? new Date().toISOString()
						: null,
				})
				.returning()
				.get();

			await writeAuditLog(db, {
				employeeId: auth.employee.id,
				benefitId: args.input.benefitId,
				action: 'Requested',
				detail:
					benefitRow.requires_contract && inserted.contract_version_accepted
						? `${benefitRow.name} contract ${inserted.contract_version_accepted} accepted and request submitted.`
						: `${benefitRow.name} benefit request submitted.`,
				performedByEmployeeId: auth.employee.id,
				performedByLabel: auth.employee.full_name,
				metadata: {
					requestId: inserted.id,
					status: inserted.status,
					contractVersionAccepted: inserted.contract_version_accepted ?? null,
					source: 'confirmBenefitRequest',
				},
			});

			return mapRequest(inserted);
		},
	},
};
