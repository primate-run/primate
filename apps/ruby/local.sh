#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$APP_DIR"

GEM_REPO="${1:-}"
if [[ -z "${GEM_REPO}" ]]; then
  echo ">> No path passed. Example: ./local.sh ../../../ruby"
  exit 1
fi
if [[ ! -f "${GEM_REPO}/primate-run.gemspec" ]]; then
  echo "!! ${GEM_REPO} does not contain primate-run.gemspec"
  exit 1
fi

echo ">> Building gem from: $GEM_REPO"
pushd "$GEM_REPO" >/dev/null
gem build primate-run.gemspec
GEM_FILE="$(ls -t primate-run-*.gem | head -n1)"
VERSION="$(echo "$GEM_FILE" | sed -n 's/^primate-run-\(.*\)\.gem$/\1/p')"
popd >/dev/null
echo ">> Using version: $VERSION"

mkdir -p vendor/cache
cp -f "${GEM_REPO}/${GEM_FILE}" vendor/cache/

rm -rf vendor/bundle

bundle config set --local path "vendor/bundle"
bundle lock --add-platform ruby >/dev/null 2>&1 || true

bundle cache

bundle install --local

bundle exec ruby -e 'require "primate"; puts "primate-run version -> #{Primate::VERSION} (from vendor/cache)"'

echo ">> Done."
