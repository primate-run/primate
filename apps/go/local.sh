#!/usr/bin/env bash
set -euo pipefail

if [ $# -eq 0 ]; then
  echo "Usage: ./local.sh /path/to/local/primate-run/go"
  exit 1
fi

LOCAL_PATH="$1"

if [ ! -d "$LOCAL_PATH" ]; then
  echo "Error: Directory $LOCAL_PATH does not exist"
  exit 1
fi

VERSION=$(cd "$LOCAL_PATH" && git describe --tags --abbrev=0 2>/dev/null || echo "")

if [ -z "$VERSION" ]; then
  echo "Error: No git tag found in $LOCAL_PATH"
  echo "Run: cd $LOCAL_PATH && git tag v0.x.y"
  exit 1
fi

go mod edit -require=github.com/primate-run/go@$VERSION

if grep -q "replace github.com/primate-run/go" go.mod; then
  sed -i.bak "s|replace github.com/primate-run/go =>.*|replace github.com/primate-run/go => $LOCAL_PATH|" go.mod
  rm go.mod.bak
else
  echo "" >> go.mod
  echo "replace github.com/primate-run/go => $LOCAL_PATH" >> go.mod
fi

go mod tidy
echo "✓ Using local primate-run/go $VERSION from $LOCAL_PATH"
