#!/usr/bin/env bash
set -euo pipefail

url="${YANOTE_VERIFY_URL:-}"
events_path="${YANOTE_EVENTS_PATH:-}"
expected_code="${YANOTE_EXPECTED_CODE:-200}"

usage() {
  cat <<'EOF'
Usage:
  verify.sh --url <url-to-call> --events <path-to-events.jsonl> [--expected-code <code>]

Examples:
  ./verify.sh --url http://localhost:8080/any-endpoint --events /data/yanote/events.jsonl

Environment alternatives:
  YANOTE_VERIFY_URL, YANOTE_EVENTS_PATH, YANOTE_EXPECTED_CODE
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --url) url="$2"; shift 2 ;;
    --events) events_path="$2"; shift 2 ;;
    --expected-code) expected_code="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 2 ;;
  esac
done

if [[ -z "$url" || -z "$events_path" ]]; then
  echo "Missing required args." >&2
  usage
  exit 2
fi

mkdir -p "$(dirname "$events_path")"
rm -f "$events_path"

code="$(curl -sS -o /dev/null -w "%{http_code}" "$url" || true)"
if [[ "$code" != "$expected_code" ]]; then
  echo "HTTP code mismatch: got=$code expected=$expected_code url=$url" >&2
  exit 1
fi

if [[ ! -s "$events_path" ]]; then
  echo "events.jsonl missing or empty: $events_path" >&2
  exit 1
fi

echo "OK: events.jsonl is not empty: $events_path"

