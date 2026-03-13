export type RuleOperator =
  | "eq"
  | "neq"
  | "lt"
  | "lte"
  | "gt"
  | "gte"
  | "in"
  | "not_in";

export interface StoredEligibilityRuleValue {
  type: string;
  operator: RuleOperator;
  value: unknown;
  version: number;
}

const DEFAULT_RULE_TYPE = "custom";
const DEFAULT_RULE_OPERATOR: RuleOperator = "eq";
const DEFAULT_RULE_VERSION = 1;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseJsonLike(value: string): unknown {
  const trimmed = value.trim();
  if (trimmed.length === 0) return "";

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function normalizeOperator(value: unknown): RuleOperator {
  switch (value) {
    case "eq":
    case "neq":
    case "lt":
    case "lte":
    case "gt":
    case "gte":
    case "in":
    case "not_in":
      return value;
    default:
      return DEFAULT_RULE_OPERATOR;
  }
}

function normalizeVersion(value: unknown): number {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }
  return DEFAULT_RULE_VERSION;
}

function normalizeType(value: unknown): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return DEFAULT_RULE_TYPE;
}

export function normalizeStoredRuleValue(
  rawValue: unknown,
): StoredEligibilityRuleValue {
  const normalizedRaw =
    typeof rawValue === "string" ? parseJsonLike(rawValue) : rawValue;

  if (isRecord(normalizedRaw)) {
    return {
      type: normalizeType(normalizedRaw.type),
      operator: normalizeOperator(normalizedRaw.operator),
      version: normalizeVersion(normalizedRaw.version),
      value: normalizedRaw.value ?? null,
    };
  }

  return {
    type: DEFAULT_RULE_TYPE,
    operator: DEFAULT_RULE_OPERATOR,
    version: DEFAULT_RULE_VERSION,
    value: normalizedRaw ?? null,
  };
}

export function hasStructuredRuleValue(rawValue: unknown): boolean {
  const normalizedRaw =
    typeof rawValue === "string" ? parseJsonLike(rawValue) : rawValue;
  return (
    isRecord(normalizedRaw) &&
    ("type" in normalizedRaw ||
      "operator" in normalizedRaw ||
      "version" in normalizedRaw)
  );
}

export function parseRuleInputValue(value: string): unknown {
  return parseJsonLike(value);
}

export function toRuleValueJson(value: unknown): string {
  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
