let benefitRequestSchemaReady: Promise<void> | null = null;

type TableInfoRow = {
	name?: string;
};

export async function ensureBenefitRequestSchema(db: D1Database) {
	if (benefitRequestSchemaReady) {
		return benefitRequestSchemaReady;
	}

	benefitRequestSchemaReady = (async () => {
		const tableInfo = await db
			.prepare("PRAGMA table_info('benefit_requests')")
			.all<TableInfoRow>();
		const columnNames = (tableInfo.results ?? [])
			.map((row) => row.name)
			.filter((name): name is string => typeof name === 'string');

		if (!columnNames.includes('review_notes')) {
			await db.exec('ALTER TABLE benefit_requests ADD COLUMN review_notes text;');
		}
	})().catch((error) => {
		benefitRequestSchemaReady = null;
		throw error;
	});

	return benefitRequestSchemaReady;
}
