#!/bin/sh
set -eu

ROOT="${OPENCLAW_DATA_ROOT:-/data/projects}"
TOKEN="${OPENCLAW_GATEWAY_TOKEN:?OPENCLAW_GATEWAY_TOKEN is required}"
DEFAULT_DIR="${ROOT}/default"

resolve_state_dir() {
  if [ -n "${OSS_PROJECT_ID:-}" ]; then
    candidate="${ROOT}/${OSS_PROJECT_ID}"
    if [ -f "${candidate}/openclaw.json" ]; then
      echo "${candidate}"
      return
    fi
  fi

  if [ -f "${DEFAULT_DIR}/openclaw.json" ]; then
    echo "${DEFAULT_DIR}"
    return
  fi

  # Legacy fallback during migration window (pre-default volumes).
  for dir in "${ROOT}"/*/; do
    [ -d "$dir" ] || continue
    base="$(basename "${dir%/}")"
    if [ "$base" = "default" ] || [ "$base" = "_legacy" ]; then
      continue
    fi
    if [ -f "${dir}openclaw.json" ]; then
      echo "${dir%/}"
      return
    fi
  done

  echo ""
}

echo "[gateway] waiting for project workspace at ${DEFAULT_DIR}/openclaw.json ..."
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

# openclaw.json uses /home/node/.openclaw/workspace paths; bind-mount layout uses
# OPENCLAW_STATE_DIR under /data/projects/{id}. Symlink so gateway + API share files.
mkdir -p /home/node
ln -sfn "$STATE" /home/node/.openclaw

echo "[gateway] OPENCLAW_STATE_DIR=${OPENCLAW_STATE_DIR}"
exec node openclaw.mjs gateway --bind lan
