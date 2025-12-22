#!/bin/bash
set -e

# Get the directory where this script is located (inside node_modules)
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "🧙 Starting configuration wizard..."
node "$DIR/../scripts/wizard.js"

echo "⚙️  Generating wallet modules..."
node "$DIR/../scripts/generate-wallet-modules.js"

echo "📦 Bundling worklet..."
# Run the npm script defined in the package's package.json
npm run gen:mobile-bundle --prefix "$DIR/.."

echo "✅ Done! Worklet bundle generated."
echo "👉 Check $DIR/../bundle/worklet.bundle.mjs"