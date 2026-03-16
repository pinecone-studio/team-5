#!/usr/bin/env sh

set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
SERVICE_ENV="$ROOT_DIR/service/.env"
WEB_ENV="$ROOT_DIR/web/.env"

has_error=0

print_ok() {
  printf 'OK   %s\n' "$1"
}

print_warn() {
  printf 'WARN %s\n' "$1"
}

print_err() {
  printf 'ERR  %s\n' "$1"
  has_error=1
}

load_env_file() {
  env_file="$1"

  if [ ! -f "$env_file" ]; then
    return 1
  fi

  # shellcheck disable=SC1090
  set -a
  . "$env_file"
  set +a
  return 0
}

check_file() {
  file_path="$1"

  if [ -f "$file_path" ]; then
    print_ok "found $(basename "$file_path")"
  else
    print_err "missing $file_path"
  fi
}

check_required_var() {
  var_name="$1"
  var_value="${2:-}"

  if [ -n "$var_value" ]; then
    print_ok "$var_name is set"
  else
    print_err "$var_name is missing"
  fi
}

check_optional_var() {
  var_name="$1"
  var_value="${2:-}"

  if [ -n "$var_value" ]; then
    print_ok "$var_name is set"
  else
    print_warn "$var_name is missing"
  fi
}

check_http() {
  url="$1"
  label="$2"

  if command -v curl >/dev/null 2>&1; then
    if curl -fsS "$url" >/dev/null 2>&1; then
      print_ok "$label reachable at $url"
    else
      print_warn "$label not reachable at $url"
    fi
  else
    print_warn "curl not installed, skipped $label check"
  fi
}

check_file "$SERVICE_ENV"
check_file "$WEB_ENV"

if load_env_file "$SERVICE_ENV"; then
  check_required_var "CLERK_SECRET_KEY" "${CLERK_SECRET_KEY:-}"
  check_required_var "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" "${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:-${CLERK_PUBLISHABLE_KEY:-}}"
  check_optional_var "FRONTEND_ORIGIN" "${FRONTEND_ORIGIN:-}"
  check_optional_var "CLOUDFLARE_ACCOUNT_ID" "${CLOUDFLARE_ACCOUNT_ID:-}"
  check_optional_var "CLOUDFLARE_D1_DATABASE_ID" "${CLOUDFLARE_D1_DATABASE_ID:-}"
  check_optional_var "CLOUDFLARE_API_TOKEN" "${CLOUDFLARE_API_TOKEN:-}"
else
  print_err "could not load $SERVICE_ENV"
fi

if load_env_file "$WEB_ENV"; then
  check_required_var "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" "${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:-}"
  check_required_var "NEXT_PUBLIC_GRAPHQL_URL" "${NEXT_PUBLIC_GRAPHQL_URL:-}"
  check_required_var "NEXT_PUBLIC_BASE_URL" "${NEXT_PUBLIC_BASE_URL:-}"
else
  print_err "could not load $WEB_ENV"
fi

check_http "http://localhost:8787/" "service"
check_http "http://localhost:3000/" "web"

if [ "$has_error" -ne 0 ]; then
  exit 1
fi
