#!/bin/sh
set -eu

ROOT="${OPENCLAW_DATA_ROOT:-/data/projects}"
TOKEN="${OPENCLAW_GATEWAY_TOKEN:?OPENCLAW_GATEWAY_TOKEN is required}"

resolve_state_dir() {
  if [ -n "${OSS_PROJECT_ID:-}" ]; then
    candidate="${ROOT}/${OSS_PROJECT_ID}"
    if [ -f "${candidate}/openclaw.json" ]; then
      echo "${candidate}"
      return
    fi
    echo ""
    return
  fi
  for dir in "${ROOT}"/*/; do
    [ -d "$dir" ] || continue
    if [ -f "${dir}openclaw.json" ]; then
      echo "${dir%/}"
      return
    fi
  done
  echo ""
}

echo "[gateway] waiting for project workspace under ${ROOT}..."
STATE=""
while [ -z "$STATE" ]; do
  STATE="$(resolve_state_dir)"
  if [ -z "$STATE" ]; then
    sleep 5
  fi
done

export OPENCLAW_GATEWAY_TOKEN="$TOKEN"
export OPENCLAW_STATE_DIR="$STATE"
export OPENCLAW_CONFIG_PATH="${STATE}/openclaw.json"

echo "[gateway] OPENCLAW_STATE_DIR=${OPENCLAW_STATE_DIR}"
exec node openclaw.mjs gateway --bind lan
