#!/usr/bin/env bash
# Generate a new admin API key for the OpenClaw agent.
# Run this from the project root as a superuser with access to the codebase.
#
# Usage:
#   ./scripts/gen-admin-key.sh            # generates key and prints it
#   ./scripts/gen-admin-key.sh --write    # also writes to .env.local

set -euo pipefail

KEY="pharos_$(openssl rand -hex 32)"

echo "Generated admin API key:"
echo ""
echo "  PHAROS_ADMIN_API_KEY=$KEY"
echo ""

if [[ "${1:-}" == "--write" ]]; then
  ENV_FILE=".env.local"

  if grep -q "^PHAROS_ADMIN_API_KEY=" "$ENV_FILE" 2>/dev/null; then
    # Replace existing key
    sed -i.bak "s/^PHAROS_ADMIN_API_KEY=.*/PHAROS_ADMIN_API_KEY=$KEY/" "$ENV_FILE"
    rm -f "$ENV_FILE.bak"
    echo "Updated $ENV_FILE (replaced existing key)"
  else
    echo "" >> "$ENV_FILE"
    echo "PHAROS_ADMIN_API_KEY=$KEY" >> "$ENV_FILE"
    echo "Appended to $ENV_FILE"
  fi
else
  echo "Run with --write to save to .env.local"
fi
