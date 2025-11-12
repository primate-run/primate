#!/usr/bin/env bash
set -euo pipefail

uv pip install -e ../../../python

uv pip show primate-run | grep Version
