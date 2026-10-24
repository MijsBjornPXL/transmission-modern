#!/usr/bin/env bash
set -Eeuo pipefail
BACKUP_PARENT=/var/backups/transmission-modern
if (( EUID != 0 )); then
  echo "Run as root: sudo bash restore.sh [BACKUP_DIRECTORY] [WEB_DIRECTORY]" >&2
  exit 1
fi
BACKUP_DIR="${1:-}"
if [[ -z "$BACKUP_DIR" ]]; then
  BACKUP_DIR="$(cat "$BACKUP_PARENT/last-backup" 2>/dev/null || true)"
fi
if [[ -z "$BACKUP_DIR" || "$BACKUP_DIR" != "$BACKUP_PARENT"/backup-* || ! -f "$BACKUP_DIR/web/index.html" ]]; then
  echo "Valid backup not found. Specify a backup directory printed by the installer." >&2
  exit 1
fi
# New installers record the exact original target; never guess on rollback.
if [[ -n "${2:-}" ]]; then
  WEB_ROOT="$2"
elif [[ -f "$BACKUP_DIR/web-root" ]]; then
  IFS= read -r WEB_ROOT < "$BACKUP_DIR/web-root"
else
  echo "This older backup does not record the original web directory." >&2
  echo "Specify it explicitly: sudo bash restore.sh '$BACKUP_DIR' /path/to/web-directory" >&2
  exit 1
fi
if [[ ! -d "$WEB_ROOT" || ! -f "$WEB_ROOT/index.html" ]]; then
  echo "Web directory missing or invalid: $WEB_ROOT" >&2
  exit 1
fi
cp -a -- "$BACKUP_DIR/web/." "$WEB_ROOT/"
echo "Transmission Web UI restored from: $BACKUP_DIR"
echo "Restored to: $WEB_ROOT"
echo "Refresh your browser with Ctrl+Shift+R."
