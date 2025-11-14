#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$APP_DIR"

if [[ $# -gt 0 ]]; then
  export PRIMATE_RUN_VERSION="$1"
  echo ">> Forcing primate-run version constraint: $PRIMATE_RUN_VERSION"
else
  unset PRIMATE_RUN_VERSION
fi

# Ensure we don't accidentally pick a cached local .gem
rm -f vendor/cache/primate-run-*.gem

rm -rf vendor/bundle
bundle config set --local path "vendor/bundle"
bundle lock --add-platform ruby >/dev/null 2>&1 || true

bundle install

bundle exec ruby -e 'require "primate"; puts "primate-run version -> #{Primate::VERSION} (published)"'
echo ">> Done."
