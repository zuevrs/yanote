#!/usr/bin/env bash
set -euo pipefail

spec="${YANOTE_SPEC_PATH:-}"
events="${YANOTE_EVENTS_PATH:-}"
out="${YANOTE_OUT_DIR:-}"

usage() {
  cat <<'EOF'
Usage:
  verify.sh --spec <path> --events <events.jsonl> --out <out-dir>

Environment alternatives:
  YANOTE_SPEC_PATH, YANOTE_EVENTS_PATH, YANOTE_OUT_DIR
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --spec) spec="$2"; shift 2 ;;
    --events) events="$2"; shift 2 ;;
    --out) out="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 2 ;;
  esac
done

if [[ -z "$spec" || -z "$events" || -z "$out" ]]; then
  echo "Missing required args." >&2
  usage
  exit 2
fi

rm -rf "$out"
mkdir -p "$out"

node "$(dirname "$0")/bin/yanote.cjs" report \
  --spec "$spec" \
  --events "$events" \
  --out "$out" \
  --exclude /health

test -s "$out/yanote-report.json" && echo "OK: yanote-report.json written"

