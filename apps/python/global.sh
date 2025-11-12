#!/usr/bin/env bash
set -euo pipefail

pkg=primate-run

uv pip uninstall "$pkg" || true

uv pip install "$pkg"

uv pip show "$pkg" | grep Version
