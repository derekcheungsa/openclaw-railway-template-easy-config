#!/usr/bin/env bash
# Smoke-test a built wrapper image the way Railway runs it.
#
# Usage: scripts/ci-smoke.sh <image>
#
# What it checks:
#   1. The openclaw CLI starts inside the image (catches entry-point and
#      Node ABI breakage after a base-image bump).
#   2. The container boots with an EMPTY volume mounted at /data and with the
#      placeholder values a template deployer may leave in place.
#   3. /setup/healthz answers (this is Railway's healthcheck path).
#   4. /setup is password protected.
#   5. /setup/api/status works, which makes the wrapper run the openclaw CLI
#      (--version and "channels add --help") end to end.
set -euo pipefail

IMAGE="${1:?usage: scripts/ci-smoke.sh <image>}"
HOST_PORT="${SMOKE_PORT:-18080}"
PASSWORD="smoke-test-password"
NAME="openclaw-smoke-$$"
DATA_DIR="$(mktemp -d)"
BASE_URL="http://127.0.0.1:${HOST_PORT}"

cleanup() {
  status=$?
  if [ "$status" -ne 0 ]; then
    echo "::group::container logs (last 120 lines)"
    docker logs --tail 120 "$NAME" 2>&1 || true
    echo "::endgroup::"
  fi
  docker rm -f "$NAME" >/dev/null 2>&1 || true
  rm -rf "$DATA_DIR" 2>/dev/null || true
  exit "$status"
}
trap cleanup EXIT

fail() {
  echo "SMOKE FAIL: $*" >&2
  exit 1
}

# Output of a CLI that crashed (missing entry point, native module built for a
# different Node, ...). The wrapper passes this text through to the API
# unchanged, so it has to be rejected explicitly.
BROKEN_CLI_PATTERN='Error:|Cannot find module|ERR_[A-Z_]+|SyntaxError|Segmentation'

echo "==> 1/5 openclaw CLI starts"
CLI_VERSION="$(docker run --rm "$IMAGE" openclaw --version 2>&1)" \
  || fail "openclaw --version failed: ${CLI_VERSION:-<no output>}"
[ -n "$CLI_VERSION" ] || fail "openclaw --version printed nothing"
if printf '%s' "$CLI_VERSION" | grep -Eq "$BROKEN_CLI_PATTERN"; then
  fail "openclaw --version printed an error: $CLI_VERSION"
fi
echo "    $CLI_VERSION"

echo "==> 2/5 container boots with an empty /data volume and placeholder env"
docker run -d --name "$NAME" -p "${HOST_PORT}:8080" \
  -e PORT=8080 \
  -e SETUP_PASSWORD="$PASSWORD" \
  -e GOOGLE_CLIENT_SECRET_BASE64="Replace_Me" \
  -e GOG_KEYRING_PASSWORD="Replace_With_Secure_Password" \
  -v "${DATA_DIR}:/data" \
  "$IMAGE" >/dev/null

echo "==> 3/5 /setup/healthz responds"
healthy=0
for _ in $(seq 1 60); do
  if curl -fsS --max-time 3 "${BASE_URL}/setup/healthz" 2>/dev/null | grep -q '"ok":true'; then
    healthy=1
    break
  fi
  if [ "$(docker inspect -f '{{.State.Running}}' "$NAME")" != "true" ]; then
    fail "container exited before the healthcheck passed"
  fi
  sleep 1
done
[ "$healthy" -eq 1 ] || fail "/setup/healthz did not answer within 60s"

echo "==> 4/5 /setup requires the password"
code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "${BASE_URL}/setup")"
[ "$code" = "401" ] || fail "expected 401 from /setup without credentials, got $code"

echo "==> 5/5 /setup/api/status runs the openclaw CLI through the wrapper"
STATUS="$(curl -fsS --max-time 90 -u ":${PASSWORD}" "${BASE_URL}/setup/api/status")" \
  || fail "/setup/api/status request failed"
printf '%s' "$STATUS" | CLI_VERSION="$CLI_VERSION" BROKEN_CLI_PATTERN="$BROKEN_CLI_PATTERN" node -e '
  const s = JSON.parse(require("fs").readFileSync(0, "utf8"));
  const broken = new RegExp(process.env.BROKEN_CLI_PATTERN);
  const version = String(s.openclawVersion || "").trim();
  const help = String(s.channelsAddHelp || "").trim();
  const problems = [];
  if (!version) problems.push("openclawVersion is empty");
  else if (broken.test(version)) problems.push("openclawVersion holds an error: " + version.slice(0, 200));
  else if (version !== process.env.CLI_VERSION.trim()) problems.push("openclawVersion " + JSON.stringify(version) + " differs from `openclaw --version` " + JSON.stringify(process.env.CLI_VERSION.trim()));
  if (!help) problems.push("channelsAddHelp is empty (CLI did not run)");
  else if (broken.test(help)) problems.push("channelsAddHelp holds an error: " + help.slice(0, 200));
  if (s.configured !== false) problems.push("expected configured=false on a fresh volume");
  if (problems.length) { console.error(problems.join("\n")); process.exit(1); }
  console.log("    wrapper reports openclaw " + version);
' || fail "unexpected /setup/api/status payload"

[ "$(docker inspect -f '{{.State.Running}}' "$NAME")" = "true" ] || fail "container is not running at the end of the test"

# Informational only: idle memory of the wrapper before any setup has run.
echo "==> idle memory: $(docker stats --no-stream --format '{{.MemUsage}}' "$NAME")"
echo "SMOKE OK"
