#!/bin/bash
# Link all local Kompo packages to a target project for development testing

set -e

TARGET_DIR="$1"
if [ -z "$TARGET_DIR" ]; then
  echo "Usage: $0 <target-project-directory>"
  echo ""
  echo "Example:"
  echo "  $0 /tmp/bun-sample"
  echo "  $0 ../my-test-project"
  exit 1
fi

KOMPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
TARGET_ROOT="$(cd "$TARGET_DIR" && pwd)"

echo "🔗 Linking local Kompo packages to $TARGET_ROOT"
echo "Kompo root: $KOMPO_ROOT"
echo ""

# Check if target directory exists
if [ ! -d "$TARGET_ROOT" ]; then
  echo "❌ Target directory does not exist: $TARGET_ROOT"
  exit 1
fi

# Check if target has package.json
if [ ! -f "$TARGET_ROOT/package.json" ]; then
  echo "❌ Target directory is not a Node.js project (no package.json found)"
  exit 1
fi

cd "$TARGET_ROOT"


# Detect package manager
if [ -f "bun.lockb" ] || [ -f "bun.lock" ]; then
  PM="bun"
  PM_ADD="bun add -D"
elif [ -f "pnpm-lock.yaml" ]; then
  PM="pnpm"
  PM_ADD="pnpm add -D"
elif [ -f "yarn.lock" ]; then
  PM="yarn"
  PM_ADD="yarn add -D"
elif [ -f "package-lock.json" ]; then
  PM="npm"
  PM_ADD="npm install --save-dev"
else
  echo "⚠️  No lockfile found, defaulting to bun"
  PM="bun"
  PM_ADD="bun add -D"
fi

echo "Detected package manager: $PM"
echo ""

# For local development, we only need to link the CLI package
# The CLI will automatically use local blueprints via file: links in its package.json
echo "📦 Linking CLI package for local development..."
$PM_ADD "file:$KOMPO_ROOT/kompo/packages/cli"

echo ""
echo "🎨 Note: Blueprint packages are already linked via CLI's package.json"
echo "   (blueprints use file: protocol to the local blueprints repo)"

echo ""
echo "✅ All packages linked successfully!"
echo ""
echo "Next steps:"
echo "1. Run '$PM install' to resolve dependencies"
echo "2. Test Kompo with: $PM exec tsx $KOMPO_ROOT/kompo/packages/cli/src/bin/kompo.ts <command>"
echo "3. Or add a script to package.json:"
echo "   \"kompo\": \"tsx $KOMPO_ROOT/kompo/packages/cli/src/bin/kompo.ts\""
