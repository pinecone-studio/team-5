#!/usr/bin/env sh

set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
DEV_VARS_FILE="$ROOT_DIR/.dev.vars"
ENV_FILE="$ROOT_DIR/.env"

if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  set -a
  . "$ENV_FILE"
  set +a
fi

CLERK_PUBLISHABLE_KEY_VALUE="${CLERK_PUBLISHABLE_KEY:-${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:-}}"
CLERK_SECRET_KEY_VALUE="${CLERK_SECRET_KEY:-}"
FRONTEND_ORIGIN_VALUE="${FRONTEND_ORIGIN:-${NEXT_PUBLIC_BASE_URL:-http://localhost:3000}}"

touch "$DEV_VARS_FILE"

ensure_key() {
  key="$1"
  value="$2"

  if [ -z "$value" ]; then
    return 0
  fi

  if grep -q "^${key}=" "$DEV_VARS_FILE"; then
    return 0
  fi

  printf '%s=%s\n' "$key" "$value" >> "$DEV_VARS_FILE"
}

ensure_key "CLERK_PUBLISHABLE_KEY" "$CLERK_PUBLISHABLE_KEY_VALUE"
ensure_key "CLERK_SECRET_KEY" "$CLERK_SECRET_KEY_VALUE"
ensure_key "FRONTEND_ORIGIN" "$FRONTEND_ORIGIN_VALUE"
ensure_key "R2_ACCESS_KEY_ID" "${R2_ACCESS_KEY_ID:-}"
ensure_key "R2_SECRET_ACCESS_KEY" "${R2_SECRET_ACCESS_KEY:-}"
