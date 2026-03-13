import { and, asc, eq } from "drizzle-orm";

import { getDb } from "../../../db/client";
import { benefit_eligibility } from "../../../db/schemas/benefit_eligibility.schema";
import { employee } from "../../../db/schemas/employee.schema";
import { eligibility_rules } from "../../../db/schemas/eligibility_rules.schema";
import {
  hasStructuredRuleValue,
  normalizeStoredRuleValue,
  type RuleOperator,
  type StoredEligibilityRuleValue,
} from "./eligibility-rule-config";

type DbClient = ReturnType<typeof getDb>;

type EmployeeRow = typeof employee.$inferSelect;
type EligibilityRow = typeof benefit_eligibility.$inferSelect;
type RuleRow = typeof eligibility_rules.$inferSelect;

export interface RuleEvaluationItem {
  ruleId: string;
  type: string;
  operator: RuleOperator;
  expectedValue: unknown;
  actualValue: unknown;
  passed: boolean;
  reason: string | null;
  version: number;
}

export interface EligibilityComputationResult {
  row: EligibilityRow;
  evaluations: RuleEvaluationItem[];
  version: number;
}

function snakeToCamel(value: string): string {
  return value.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase());
}

function getFactValue(employeeRow: EmployeeRow, ruleType: string): unknown {
  const source = employeeRow as Record<string, unknown>;

  switch (ruleType) {
    case "employment_status":
      return employeeRow.employment_status ?? employeeRow.status;
    case "okr_submitted":
      return employeeRow.okr_submitted ?? (
        employeeRow.okr_status === "submitted" || employeeRow.okr_status === "success"
      );
    case "attendance":
      return employeeRow.late_arrival_count ?? employeeRow.lateCount ?? 0;
    default:
      break;
  }

  if (ruleType in source) return source[ruleType];

  const camelCaseType = snakeToCamel(ruleType);
  if (camelCaseType in source) return source[camelCaseType];

  return null;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function toBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return null;
}

function equalsValue(left: unknown, right: unknown): boolean {
  if (left === right) return true;

  const leftNumber = toNumber(left);
  const rightNumber = toNumber(right);
  if (leftNumber !== null && rightNumber !== null) {
    return leftNumber === rightNumber;
  }

  const leftBool = toBoolean(left);
  const rightBool = toBoolean(right);
  if (leftBool !== null && rightBool !== null) {
    return leftBool === rightBool;
  }

  return String(left) === String(right);
}

function compareValues(
  operator: RuleOperator,
  actualValue: unknown,
  expectedValue: unknown,
): boolean {
  switch (operator) {
    case "eq":
      return equalsValue(actualValue, expectedValue);
    case "neq":
      return !equalsValue(actualValue, expectedValue);
    case "lt":
    case "lte":
    case "gt":
    case "gte": {
      const actualNumber = toNumber(actualValue);
      const expectedNumber = toNumber(expectedValue);
      if (actualNumber === null || expectedNumber === null) return false;

      if (operator === "lt") return actualNumber < expectedNumber;
      if (operator === "lte") return actualNumber <= expectedNumber;
      if (operator === "gt") return actualNumber > expectedNumber;
      return actualNumber >= expectedNumber;
    }
  }
}

function getLatestVersion(rules: RuleRow[]): number {
  if (rules.length === 0) return 1;

  return rules.reduce((latest, row) => {
    const normalized = normalizeStoredRuleValue(row.value);
    return Math.max(latest, normalized.version);
  }, 1);
}

function mapEvaluation(
  employeeRow: EmployeeRow,
  row: RuleRow,
  config: StoredEligibilityRuleValue,
): RuleEvaluationItem {
  if (!hasStructuredRuleValue(row.value)) {
    // Backward compatibility for legacy rows that only stored primitive values.
    return {
      ruleId: row.id,
      type: "legacy_rule",
      operator: "eq",
      expectedValue: config.value,
      actualValue: null,
      passed: true,
      reason: null,
      version: config.version,
    };
  }

  const actualValue = getFactValue(employeeRow, config.type);
  const passed = compareValues(config.operator, actualValue, config.value);

  return {
    ruleId: row.id,
    type: config.type,
    operator: config.operator,
    expectedValue: config.value,
    actualValue,
    passed,
    reason: passed ? null : row.error_message,
    version: config.version,
  };
}

function isOverrideActive(
  row: EligibilityRow,
  nowIso: string,
): boolean {
  if (!row.override_by) return false;
  if (!row.override_expires_at) return true;
  return row.override_expires_at > nowIso;
}

export async function recomputeBenefitEligibility(
  db: DbClient,
  input: { employeeId: string; benefitId: string; computedAt?: string | null },
): Promise<EligibilityComputationResult> {
  const employeeRow = await db
    .select()
    .from(employee)
    .where(eq(employee.id, input.employeeId))
    .get();

  if (!employeeRow) {
    throw new Error("Employee not found");
  }

  const allRules = await db
    .select()
    .from(eligibility_rules)
    .where(
      and(
        eq(eligibility_rules.benefit_id, input.benefitId),
        eq(eligibility_rules.is_active, true),
      ),
    )
    .orderBy(asc(eligibility_rules.priority), asc(eligibility_rules.id))
    .all();

  const latestVersion = getLatestVersion(allRules);
  const activeVersionRules = allRules.filter((row) => {
    const config = normalizeStoredRuleValue(row.value);
    return config.version === latestVersion;
  });

  const evaluations = activeVersionRules.map((row) =>
    mapEvaluation(employeeRow, row, normalizeStoredRuleValue(row.value)),
  );

  const now = input.computedAt ?? new Date().toISOString();
  const computedStatus: EligibilityRow["status"] = evaluations.every((rule) => rule.passed)
    ? "eligible"
    : "locked";

  const existing = await db
    .select()
    .from(benefit_eligibility)
    .where(
      and(
        eq(benefit_eligibility.employee_id, input.employeeId),
        eq(benefit_eligibility.benefit_id, input.benefitId),
      ),
    )
    .get();

  if (!existing) {
    const inserted = await db
      .insert(benefit_eligibility)
      .values({
        employee_id: input.employeeId,
        benefit_id: input.benefitId,
        status: computedStatus,
        rule_evaluation_json: evaluations,
        computed_at: now,
        override_by: null,
        override_reason: null,
        override_expires_at: null,
      })
      .returning()
      .get();

    return {
      row: inserted,
      evaluations,
      version: latestVersion,
    };
  }

  const updated = await db
    .update(benefit_eligibility)
    .set({
      status: isOverrideActive(existing, now) ? "active" : computedStatus,
      rule_evaluation_json: evaluations,
      computed_at: now,
    })
    .where(
      and(
        eq(benefit_eligibility.employee_id, input.employeeId),
        eq(benefit_eligibility.benefit_id, input.benefitId),
      ),
    )
    .returning()
    .get();

  return {
    row: updated,
    evaluations,
    version: latestVersion,
  };
}
