import { and, eq } from "drizzle-orm";

import { getDb } from "../../../db/client";
import { benefit_requests } from "../../../db/schemas/benefit_request.schema";

const mapRequest = (row: typeof benefit_requests.$inferSelect) => ({
  id: row.id,
  employeeId: row.employee_id,
  benefitId: row.benefit_id,
  status: row.status,
  contractVersionAccepted: row.contract_version_accepted,
  contractAcceptedAt: row.contract_accepted_at,
  reviewedBy: row.reviewed_by ?? null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const benefitRequestQuery = {
  Query: {
    benefitRequests: async (
      _parent: unknown,
      args: { employeeId?: string | null; benefitId?: string | null },
      context: { env: Env },
    ) => {
      const db = getDb(context.env.DB);

      const conditions = [];
      if (args.employeeId) {
        conditions.push(eq(benefit_requests.employee_id, args.employeeId));
      }
      if (args.benefitId) {
        conditions.push(eq(benefit_requests.benefit_id, args.benefitId));
      }

      const rows = await db
        .select()
        .from(benefit_requests)
        .where(
          conditions.length === 0
            ? undefined
            : conditions.length === 1
            ? conditions[0]
            : and(...conditions),
        )
        .all();

      return rows.map(mapRequest);
    },
  },
};

