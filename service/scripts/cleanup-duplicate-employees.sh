#!/usr/bin/env sh

set -eu

usage() {
	echo "Usage:"
	echo "  sh ./scripts/cleanup-duplicate-employees.sh --list (--local | --remote)"
	echo "  sh ./scripts/cleanup-duplicate-employees.sh --merge --keep-id <employee_id> --drop-id <employee_id> (--local | --remote)"
	echo ""
	echo "Examples:"
	echo "  sh ./scripts/cleanup-duplicate-employees.sh --list --local"
	echo "  sh ./scripts/cleanup-duplicate-employees.sh --merge --keep-id emp_123 --drop-id emp_456 --remote"
}

MODE=""
LOCATION=""
KEEP_ID=""
DROP_ID=""

while [ "$#" -gt 0 ]; do
	case "$1" in
		--list)
			MODE="list"
			;;
		--merge)
			MODE="merge"
			;;
		--local)
			LOCATION="--local"
			;;
		--remote)
			LOCATION="--remote"
			;;
		--keep-id)
			shift
			KEEP_ID="${1:-}"
			;;
		--drop-id)
			shift
			DROP_ID="${1:-}"
			;;
		--help|-h)
			usage
			exit 0
			;;
		*)
			echo "Unknown argument: $1" >&2
			usage
			exit 1
			;;
	esac
	shift
done

if [ -z "$MODE" ] || [ -z "$LOCATION" ]; then
	usage
	exit 1
fi

run_sql() {
	SQL_FILE="$1"
	sh ./scripts/with-env.sh wrangler d1 execute my-db-name "$LOCATION" --file "$SQL_FILE"
}

if [ "$MODE" = "list" ]; then
	SQL_FILE="$(mktemp /tmp/duplicate-employees-list.XXXXXX.sql)"
	trap 'rm -f "$SQL_FILE"' EXIT INT TERM
	cat > "$SQL_FILE" <<'SQL'
SELECT
	lower(trim(email)) AS normalized_email,
	COUNT(*) AS duplicate_count,
	GROUP_CONCAT(id, ', ') AS employee_ids,
	GROUP_CONCAT(full_name, ', ') AS employee_names
FROM benefit_employee
WHERE email IS NOT NULL AND trim(email) <> ''
GROUP BY lower(trim(email))
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, normalized_email ASC;
SQL
	run_sql "$SQL_FILE"
	exit 0
fi

if [ -z "$KEEP_ID" ] || [ -z "$DROP_ID" ]; then
	echo "--merge requires both --keep-id and --drop-id." >&2
	usage
	exit 1
fi

if [ "$KEEP_ID" = "$DROP_ID" ]; then
	echo "--keep-id and --drop-id must be different." >&2
	exit 1
fi

SQL_FILE="$(mktemp /tmp/duplicate-employees-merge.XXXXXX.sql)"
trap 'rm -f "$SQL_FILE"' EXIT INT TERM
cat > "$SQL_FILE" <<SQL
BEGIN TRANSACTION;

UPDATE benefit_requests
SET employee_id = '$KEEP_ID'
WHERE employee_id = '$DROP_ID';

UPDATE benefit_requests
SET reviewed_by = '$KEEP_ID'
WHERE reviewed_by = '$DROP_ID';

INSERT INTO benefit_eligibility (
	employee_id,
	benefit_id,
	status,
	rule_evaluation_json,
	computed_at,
	override_by,
	override_reason,
	override_expires_at
)
SELECT
	'$KEEP_ID',
	benefit_id,
	status,
	rule_evaluation_json,
	computed_at,
	CASE WHEN override_by = '$DROP_ID' THEN '$KEEP_ID' ELSE override_by END,
	override_reason,
	override_expires_at
FROM benefit_eligibility
WHERE employee_id = '$DROP_ID'
ON CONFLICT(employee_id, benefit_id) DO UPDATE SET
	status = excluded.status,
	rule_evaluation_json = excluded.rule_evaluation_json,
	computed_at = excluded.computed_at,
	override_by = COALESCE(excluded.override_by, benefit_eligibility.override_by),
	override_reason = COALESCE(excluded.override_reason, benefit_eligibility.override_reason),
	override_expires_at = COALESCE(excluded.override_expires_at, benefit_eligibility.override_expires_at);

DELETE FROM benefit_eligibility
WHERE employee_id = '$DROP_ID';

UPDATE benefit_eligibility
SET override_by = '$KEEP_ID'
WHERE override_by = '$DROP_ID';

UPDATE audit_logs
SET employee_id = '$KEEP_ID'
WHERE employee_id = '$DROP_ID';

UPDATE audit_logs
SET performed_by_employee_id = '$KEEP_ID'
WHERE performed_by_employee_id = '$DROP_ID';

DELETE FROM benefit_employee
WHERE id = '$DROP_ID';

COMMIT;
SQL

run_sql "$SQL_FILE"
