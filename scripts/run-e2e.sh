#!/usr/bin/env bash
# EdAI E2E test runner — local development helper
# All modes use NEXT_PUBLIC_USE_MOCKS=true and headless=false for visibility.
# CI pipeline always overrides with --headless (default Playwright behavior when CI=true).
#
# Usage:
#   ./scripts/run-e2e.sh           # all tests, headed
#   ./scripts/run-e2e.sh p0        # P0 only, headed (match prod gate)
#   ./scripts/run-e2e.sh p1        # P1 only, headed
#   ./scripts/run-e2e.sh p2        # P2 only, headed
#   ./scripts/run-e2e.sh all       # all 122 tests, headed
#   ./scripts/run-e2e.sh ui        # Playwright UI mode (interactive)
#   ./scripts/run-e2e.sh <file>    # single spec file, e.g. auth

set -e

FILTER="${1:-all}"
BASE="pnpm --filter @rv/web exec playwright test --project=chromium --headed"
export NEXT_PUBLIC_USE_MOCKS=true

cd "$(dirname "$0")/.."

case "$FILTER" in
  p0)
    echo "▶ Running P0 tests (headed)..."
    $BASE --grep "@P0"
    ;;
  p1)
    echo "▶ Running P1 tests (headed)..."
    $BASE --grep "@P1"
    ;;
  p2)
    echo "▶ Running P2 tests (headed)..."
    $BASE --grep "@P2"
    ;;
  ui)
    echo "▶ Opening Playwright UI mode..."
    NEXT_PUBLIC_USE_MOCKS=true pnpm --filter @rv/web exec playwright test --ui
    ;;
  all|*)
    if [[ "$FILTER" != "all" && "$FILTER" != "" ]]; then
      # treat as a spec filename fragment
      echo "▶ Running tests matching: $FILTER (headed)..."
      $BASE --grep-invert "" "e2e/$FILTER"* 2>/dev/null || $BASE "e2e/$FILTER"*
    else
      echo "▶ Running all 122 tests (headed)..."
      $BASE
    fi
    ;;
esac

echo ""
echo "✓ Done. Open apps/web/playwright-report/index.html to view results."
