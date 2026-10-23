#!/usr/bin/env bash
set -Eeuo pipefail
BACKUP_DIR="${1:-}"
WEB_ROOT="${2:-/usr/share/transmission/web}"
if (( EUID != 0 )); then
  echo "Run as root: sudo bash restore.sh /var/backups/transmission-modern/backup-..." >&2
  exit 1
fi
if [[ -z "${BACKUP_DIR}" ]]; then
  BACKUP_DIR="$(cat /var/backups/transmission-modern/last-backup 2>/dev/null || true)"
fi
if [[ -z "${BACKUP_DIR}" || "${BACKUP_DIR}" != /var/backups/transmission-modern/backup-* || ! -f "${BACKUP_DIR}/web/index.html" ]]; then
  echo "Valid backup not found. Supply the backup directory printed during installation." >&2
  exit 1
fi
if [[ ! -d "${WEB_ROOT}" ]]; then
  echo "Web directory missing: ${WEB_ROOT}" >&2
  exit 1
fi
cp -a -- "${BACKUP_DIR}/web/." "${WEB_ROOT}/"
echo "Original Transmission web interface restored from: ${BACKUP_DIR}"
echo "Refresh your browser with Ctrl+F5 (or a private tab on mobile)."
