#!/usr/bin/env bash
# Generates playwright/.env.test from the project's .env.local
# Usage: cd playwright && ./setup-env.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_LOCAL="$PROJECT_ROOT/.env.local"
ENV_TEST="$SCRIPT_DIR/.env.test"

if [ ! -f "$ENV_LOCAL" ]; then
  echo "ERROR: $ENV_LOCAL not found. Copy .env.local.example and fill it in first." >&2
  exit 1
fi

# Source .env.local values (handles quoted and unquoted values)
set -a
source "$ENV_LOCAL"
set +a

cat > "$ENV_TEST" <<EOF
# Auto-generated from .env.local by setup-env.sh — do not commit
# Re-run: cd playwright && ./setup-env.sh

# Supabase (test project — same as dev for local testing)
TEST_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
TEST_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
TEST_SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}

# Stripe (test-mode keys from .env.local)
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}
NEXT_PUBLIC_STRIPE_PRICE_MONTHLY=${NEXT_PUBLIC_STRIPE_PRICE_MONTHLY}
NEXT_PUBLIC_STRIPE_PRICE_ANNUAL=${NEXT_PUBLIC_STRIPE_PRICE_ANNUAL}

# Anthropic
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}

# Test users (created automatically by global-setup.ts)
TEST_FREE_USER_EMAIL=free@test.plexease.io
TEST_FREE_USER_PASSWORD=TestPassword123!
TEST_PRO_USER_EMAIL=pro@test.plexease.io
TEST_PRO_USER_PASSWORD=TestPassword123!
EOF

echo "Created $ENV_TEST"
