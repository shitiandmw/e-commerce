#!/usr/bin/env bash
# Chosen direction:
# - Run on the host via cron
# - Use docker exec against the Postgres container
# - Write local pg_dump custom-format backups
# - Keep local backups for a configurable number of days

set -euo pipefail

CONTAINER_NAME="${CONTAINER_NAME:-ecommerce-prod-postgres}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/ecommerce-postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
FILE_PREFIX="${FILE_PREFIX:-medusa}"
LOCK_FILE="${LOCK_FILE:-/tmp/${FILE_PREFIX}-pg-backup.lock}"
LOG_FILE="${LOG_FILE:-$BACKUP_DIR/backup.log}"

TIMESTAMP="$(date '+%Y%m%d-%H%M%S')"
HOST_NAME="$(hostname -s 2>/dev/null || hostname)"
TMP_FILE="$BACKUP_DIR/${FILE_PREFIX}-${HOST_NAME}-${TIMESTAMP}.dump.tmp"
FINAL_FILE="${TMP_FILE%.tmp}"

mkdir -p "$BACKUP_DIR"
touch "$LOG_FILE"

exec >>"$LOG_FILE" 2>&1

log() {
  printf '[%s] %s\n' "$(date '+%F %T')" "$*"
}

fail() {
  log "ERROR: $*"
  exit 1
}

cleanup() {
  local exit_code="$1"

  if [ "$exit_code" -ne 0 ]; then
    rm -f "$TMP_FILE"
    log "Backup failed"
  fi
}

trap 'cleanup $?' EXIT

command -v docker >/dev/null 2>&1 || fail "docker is not installed"
command -v flock >/dev/null 2>&1 || fail "flock is not installed"

case "$RETENTION_DAYS" in
  ''|*[!0-9]*)
    fail "RETENTION_DAYS must be a positive integer"
    ;;
esac

if [ "$RETENTION_DAYS" -lt 1 ]; then
  fail "RETENTION_DAYS must be greater than or equal to 1"
fi

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  fail "another backup process is already running"
fi

if ! docker inspect -f '{{.State.Running}}' "$CONTAINER_NAME" 2>/dev/null | grep -qx 'true'; then
  fail "container is not running: $CONTAINER_NAME"
fi

log "Starting backup for container=$CONTAINER_NAME"
log "Writing dump to $FINAL_FILE"

docker exec "$CONTAINER_NAME" sh -lc '
  set -eu
  export PGPASSWORD="$POSTGRES_PASSWORD"
  exec pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc
' > "$TMP_FILE"

mv "$TMP_FILE" "$FINAL_FILE"

find "$BACKUP_DIR" -maxdepth 1 -type f -name '*.dump' -mtime +"$RETENTION_DAYS" -print -delete \
  | while IFS= read -r removed_file; do
      log "Removed expired backup: $removed_file"
    done

log "Backup completed: $FINAL_FILE ($(du -h "$FINAL_FILE" | awk '{print $1}'))"
