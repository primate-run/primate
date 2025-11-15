#!/usr/bin/env bash
set -euo pipefail

# Remove replace directive if it exists
if grep -q "replace github.com/primate-run/go" go.mod; then
  sed -i.bak "/replace github.com\/primate-run\/go/d" go.mod
  rm go.mod.bak
  echo "✓ Removed replace directive"
else
  echo "No replace directive found"
fi

# Update to latest version
go get github.com/primate-run/go@latest
go mod tidy

echo "✓ Using latest published primate-run/go"
