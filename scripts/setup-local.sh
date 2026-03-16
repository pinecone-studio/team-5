#!/usr/bin/env sh

set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"

copy_if_missing() {
  source_file="$1"
  target_file="$2"

  if [ -f "$target_file" ]; then
    printf 'exists: %s\n' "$target_file"
    return 0
  fi

  cp "$source_file" "$target_file"
  printf 'created: %s\n' "$target_file"
}

copy_if_missing "$ROOT_DIR/service/.env.example" "$ROOT_DIR/service/.env"
copy_if_missing "$ROOT_DIR/web/.env.example" "$ROOT_DIR/web/.env"

printf '\nnext:\n'
printf '1. Fill real Clerk and Cloudflare values into service/.env and web/.env\n'
printf '2. Run npm install in root, service, and web if dependencies are missing\n'
printf '3. Run npm run service:dev and npm run web:dev\n'
printf '4. Run npm run doctor\n'
