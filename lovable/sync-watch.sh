#!/usr/bin/env bash
# RealDoor Lovable ↔ canonical sync watcher.
# Polls every 10 minutes; stops after 2 consecutive idle windows (no changes).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/realdoor-ui" && pwd)"
STATE_DIR="$REPO_ROOT/lovable/.sync-state"
STATE_FILE="$STATE_DIR/fingerprints.jsonl"
LOG_FILE="$STATE_DIR/watch.log"
INTERVAL_SEC=600   # 10 minutes
CHECK_EVERY=2      # compare every N loops
PROMPT_FILE="$REPO_ROOT/lovable/SYNC_AGENT_PROMPT.md"

mkdir -p "$STATE_DIR"

log() {
  local msg="[$(date -Iseconds)] $*"
  echo "$msg" | tee -a "$LOG_FILE"
}

fingerprint() {
  cd "$REPO_ROOT"
  git fetch origin lovable/realdoor-ui --quiet 2>/dev/null || true
  git fetch lovable main --quiet 2>/dev/null || true

  local local_head origin_head lovable_head dirty
  local_head="$(git rev-parse HEAD 2>/dev/null || echo none)"
  origin_head="$(git rev-parse origin/lovable/realdoor-ui 2>/dev/null || echo none)"
  lovable_head="$(git rev-parse lovable/main 2>/dev/null || echo none)"
  if git diff --quiet && git diff --cached --quiet; then
    dirty="clean"
  else
    dirty="dirty"
  fi

  # Contract mtime as cheap local signal
  local contract_mtime="none"
  if [[ -f shared/realdoor-contract.json ]]; then
    contract_mtime="$(stat -c %Y shared/realdoor-contract.json 2>/dev/null || stat -f %m shared/realdoor-contract.json)"
  fi

  printf '%s|%s|%s|%s|%s' "$local_head" "$origin_head" "$lovable_head" "$dirty" "$contract_mtime"
}

emit_tick() {
  local loop="$1" fp="$2" changed="$3"
  local payload
  payload=$(jq -n \
    --arg prompt "Run RealDoor Lovable sync agent. Read $PROMPT_FILE and execute one full sync cycle. Loop=$loop changed=$changed fingerprint=$fp" \
    --arg fp "$fp" \
    --argjson loop "$loop" \
    --arg changed "$changed" \
    '{prompt: $prompt, fingerprint: $fp, loop: $loop, changed: $changed}')
  echo "AGENT_LOOP_TICK_REALDOOR_SYNC $payload"
}

loop=0
anchor_fp=""

log "sync-watch starting (interval=${INTERVAL_SEC}s, stop after ${CHECK_EVERY} idle loops)"
log "repo=$REPO_ROOT"

while true; do
  loop=$((loop + 1))
  fp="$(fingerprint)"
  changed="false"

  if [[ -n "$anchor_fp" && "$fp" != "$anchor_fp" ]]; then
    changed="true"
    log "loop=$loop CHANGE since anchor"
    log "  anchor: $anchor_fp"
    log "  now:    $fp"
  else
    log "loop=$loop unchanged vs anchor"
  fi

  echo "$fp" >> "$STATE_FILE"
  emit_tick "$loop" "$fp" "$changed"

  if (( loop % CHECK_EVERY == 0 )); then
    if [[ -n "$anchor_fp" && "$fp" == "$anchor_fp" ]]; then
      log "no changes in last $CHECK_EVERY loops — stopping watcher"
      echo "AGENT_LOOP_STOP_REALDOOR_SYNC {\"reason\":\"idle\",\"loops\":$loop}"
      exit 0
    fi
    anchor_fp="$fp"
    log "anchor reset at loop $loop"
  elif (( loop == 1 )); then
    anchor_fp="$fp"
    log "initial anchor set"
  fi

  sleep "$INTERVAL_SEC"
done
