import { and, desc, eq, ne } from "drizzle-orm";

import { getDb } from "../../../db/client";
import { benefits } from "../../../db/schemas/benefits.schema";
import { contracts } from "../../../db/schemas/contract.schema";

type Db = ReturnType<typeof getDb>;

export async function getBenefitById(db: Db, benefitId: string) {
	return db.select().from(benefits).where(eq(benefits.id, benefitId)).get();
}

export async function getContractById(db: Db, contractId: string) {
	return db.select().from(contracts).where(eq(contracts.id, contractId)).get();
}

export async function ensureBenefitExists(db: Db, benefitId: string) {
	const benefitRow = await getBenefitById(db, benefitId);

	if (!benefitRow) {
		throw new Error("Benefit not found");
	}

	return benefitRow;
}

export async function ensureUniqueContractVersion(params: {
	db: Db;
	benefitId: string;
	version: string;
	excludeId?: string | null;
}) {
	const existing = await params.db
		.select()
		.from(contracts)
		.where(
			and(
				eq(contracts.benefit_id, params.benefitId),
				eq(contracts.version, params.version),
				...(params.excludeId ? [ne(contracts.id, params.excludeId)] : []),
			),
		)
		.get();

	if (existing) {
		throw new Error(
			`Contract version ${params.version} already exists for this benefit.`,
		);
	}
}

export async function findActiveContractForBenefit(db: Db, benefitId: string) {
	const benefitRow = await getBenefitById(db, benefitId);

	if (!benefitRow) {
		return null;
	}

	if (benefitRow.active_contract_id) {
		const activeById = await db
			.select()
			.from(contracts)
			.where(
				and(
					eq(contracts.id, benefitRow.active_contract_id),
					eq(contracts.is_active, true),
				),
			)
			.get();

		if (activeById) {
			return activeById;
		}
	}

	return db
		.select()
		.from(contracts)
		.where(
			and(
				eq(contracts.benefit_id, benefitId),
				eq(contracts.is_active, true),
			),
		)
		.orderBy(desc(contracts.effective_date), desc(contracts.version))
		.get()
		.then((row) => row ?? null);
}

export async function setActiveContractForBenefit(
	db: Db,
	benefitId: string,
	contractId: string,
) {
	await db
		.update(contracts)
		.set({ is_active: false })
		.where(
			and(
				eq(contracts.benefit_id, benefitId),
				ne(contracts.id, contractId),
			),
		);

	await db
		.update(contracts)
		.set({ is_active: true })
		.where(eq(contracts.id, contractId));

	await db
		.update(benefits)
		.set({ active_contract_id: contractId })
		.where(eq(benefits.id, benefitId));

	return getContractById(db, contractId);
}

export async function syncBenefitActiveContract(db: Db, benefitId: string) {
	const fallbackActiveContract = await db
		.select()
		.from(contracts)
		.where(
			and(
				eq(contracts.benefit_id, benefitId),
				eq(contracts.is_active, true),
			),
		)
		.orderBy(desc(contracts.effective_date), desc(contracts.version))
		.get();

	await db
		.update(benefits)
		.set({ active_contract_id: fallbackActiveContract?.id ?? null })
		.where(eq(benefits.id, benefitId));

	return fallbackActiveContract ?? null;
}
