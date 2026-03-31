#!/usr/bin/env bash

set -euo pipefail

uvicorn app.main:app --app-dir /app/backend --host 0.0.0.0 --port 8000 &
backend_pid=$!

wait_for_backend() {
  for _ in $(seq 1 60); do
    if ! kill -0 "$backend_pid" 2>/dev/null; then
      return 1
    fi

    if /opt/venv/bin/python - <<'PY'
import sys
from urllib.request import urlopen

try:
    with urlopen("http://127.0.0.1:8000/api/settings/llm", timeout=1) as response:
        sys.exit(0 if response.status < 500 else 1)
except Exception:
    sys.exit(1)
PY
    then
      return 0
    fi

    sleep 1
  done

  return 1
}

if ! wait_for_backend; then
  echo "Backend failed to become ready in time." >&2
  kill -TERM "$backend_pid" 2>/dev/null || true
  wait "$backend_pid" 2>/dev/null || true
  exit 1
fi

cd /app/frontend
node server.js &
frontend_pid=$!

shutdown() {
  kill -TERM "$backend_pid" "$frontend_pid" 2>/dev/null || true
  wait "$backend_pid" 2>/dev/null || true
  wait "$frontend_pid" 2>/dev/null || true
}

trap shutdown INT TERM

if wait -n "$backend_pid" "$frontend_pid"; then
  status=0
else
  status=$?
fi

shutdown
exit "$status"
