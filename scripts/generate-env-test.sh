#!/usr/bin/env bash
# Generate playwright/.env.test from .env.local
# Usage: npm run test:setup (or bash scripts/generate-env-test.sh)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_LOCAL="$ROOT_DIR/.env.local"
ENV_TEST="$ROOT_DIR/playwright/.env.test"

if [ ! -f "$ENV_LOCAL" ]; then
  echo "Error: .env.local not found at $ENV_LOCAL"
  echo "Copy .env.local.example to .env.local and fill in your values first."
  exit 1
fi

# Read values from .env.local
get_val() {
  grep "^$1=" "$ENV_LOCAL" | cut -d'=' -f2-
}

SUPABASE_URL=$(get_val NEXT_PUBLIC_SUPABASE_URL)
SUPABASE_ANON_KEY=$(get_val NEXT_PUBLIC_SUPABASE_ANON_KEY)
SUPABASE_SERVICE_ROLE_KEY=$(get_val SUPABASE_SERVICE_ROLE_KEY)
STRIPE_SECRET_KEY=$(get_val STRIPE_SECRET_KEY)
STRIPE_PUBLISHABLE_KEY=$(get_val NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
STRIPE_PRICE_MONTHLY=$(get_val NEXT_PUBLIC_STRIPE_PRICE_MONTHLY)
STRIPE_PRICE_ANNUAL=$(get_val NEXT_PUBLIC_STRIPE_PRICE_ANNUAL)
ANTHROPIC_API_KEY=$(get_val ANTHROPIC_API_KEY)

cat > "$ENV_TEST" <<EOF
# Auto-generated from .env.local — do not edit manually
# Regenerate with: npm run test:setup

# Supabase (mapped from .env.local)
TEST_SUPABASE_URL=$SUPABASE_URL
TEST_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
TEST_SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY

# Test users (created automatically by globalSetup)
TEST_FREE_USER_EMAIL=free@test.plexease.io
TEST_FREE_USER_PASSWORD=TestFreeUser2026!
TEST_PRO_USER_EMAIL=pro@test.plexease.io
TEST_PRO_USER_PASSWORD=TestProUser2026!

# Stripe
STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$STRIPE_PUBLISHABLE_KEY
NEXT_PUBLIC_STRIPE_PRICE_MONTHLY=$STRIPE_PRICE_MONTHLY
NEXT_PUBLIC_STRIPE_PRICE_ANNUAL=$STRIPE_PRICE_ANNUAL

# Anthropic
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
EOF

echo "Generated $ENV_TEST"
