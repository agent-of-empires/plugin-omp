#!/bin/sh
set -eu

omp_bin=${OMP_BIN:-omp}
case "$omp_bin" in
  */*) ;;
  *) omp_bin=$(command -v "$omp_bin") ;;
esac
version_output=$("$omp_bin" --version)
case "$version_output" in
  omp/*) expected_version=${version_output#omp/} ;;
  *) printf '%s\n' "Unsupported OMP --version output: $version_output" >&2; exit 1 ;;
esac
plugin_dir=$(CDPATH= cd -- "$(dirname -- "$0")/../omp-extension" && pwd)
smoke_extension=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)/omp-native-smoke-extension.ts
tmp_home=$(mktemp -d "${TMPDIR:-/tmp}/omp-integration-smoke.XXXXXX")
uid=$(id -u)
instance_id="omp_smoke_$(date +%s)_$$"
hook_root="/tmp/aoe-hooks-$uid"
hook_dir="$hook_root/$instance_id"
marker="$tmp_home/session-started"
log="$tmp_home/omp.log"
mkdir -p "$tmp_home/tmp" "$tmp_home/fake-bin"
ln -s /bin/echo "$tmp_home/fake-bin/omp"

cleanup() {
  rm -f "$hook_dir/integration-omp.agent-of-empires.json" "$hook_dir/integration-omp.agent-of-empires.reply.json"
  rmdir "$hook_dir" 2>/dev/null || true
  rmdir "$hook_root" 2>/dev/null || true
  rm -rf "$tmp_home"
}
trap cleanup EXIT
trap 'exit 1' HUP INT TERM

if env -i \
  PATH="$tmp_home/fake-bin:$PATH" \
  HOME="$tmp_home" \
  TMPDIR="$tmp_home/tmp" \
  XDG_CONFIG_HOME="$tmp_home/config" \
  XDG_DATA_HOME="$tmp_home/data" \
  XDG_CACHE_HOME="$tmp_home/cache" \
  AOE_INSTANCE_ID="$instance_id" \
  OMP_EXPECTED_VERSION="$expected_version" \
  OMP_SMOKE_MARKER="$marker" \
  "$omp_bin" --model openai/gpt-5.2 --mode rpc --extension "$plugin_dir/index.ts" --extension "$smoke_extension" </dev/null >"$log" 2>&1; then
  :
elif [ ! -f "$marker" ]; then
  cat "$log" >&2
  printf '%s\n' "OMP did not reach session_start; ensure OMP_BIN names an installed supported OMP CLI." >&2
  exit 1
fi

[ "$(cat "$marker" 2>/dev/null || true)" = "integration-snapshot-ok" ] || {
  cat "$log" >&2
  printf '%s\n' "OMP did not load the AoE extension and publish its integration snapshot." >&2
  exit 1
}
