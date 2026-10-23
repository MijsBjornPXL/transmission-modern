#!/usr/bin/env bash
set -Eeuo pipefail

SOURCE_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
WEB_ROOT="${1:-/usr/share/transmission/web}"
BACKUP_PARENT="/var/backups/transmission-modern"

if (( EUID != 0 )); then
  echo "Run this script as root: sudo bash install.sh" >&2
  exit 1
fi

for relative_path in index.html css/base.css css/desktop.css css/mobile.css css/theme.css css/refinements.css css/progress.css css/wide-progress.css css/presets.css css/minimal-fixed.css js/theme-picker.js js/rpc.js js/ui.js js/app.js; do
  if [[ ! -f "${SOURCE_DIR}/${relative_path}" ]]; then
    echo "Missing package file: ${relative_path}" >&2
    exit 1
  fi
done

if [[ ! -d "${WEB_ROOT}" || ! -f "${WEB_ROOT}/index.html" ]]; then
  echo "Transmission web directory was not found: ${WEB_ROOT}" >&2
  echo "Specify your real web directory as the first argument." >&2
  exit 1
fi

mkdir -p -m 700 "${BACKUP_PARENT}"
BACKUP_DIR="$(mktemp -d "${BACKUP_PARENT}/backup-$(date +%Y%m%d-%H%M%S)-XXXX")"
chmod 700 "${BACKUP_DIR}"
cp -a -- "${WEB_ROOT}" "${BACKUP_DIR}/web"

echo "Backup saved to ${BACKUP_DIR}/web"
install -d -m 755 "${WEB_ROOT}/css" "${WEB_ROOT}/js"
for relative_path in index.html css/base.css css/desktop.css css/mobile.css css/theme.css css/refinements.css css/progress.css css/wide-progress.css css/presets.css css/minimal-fixed.css js/theme-picker.js js/rpc.js js/ui.js js/app.js; do
  install -m 644 "${SOURCE_DIR}/${relative_path}" "${WEB_ROOT}/${relative_path}"
done

printf '%s\n' "${BACKUP_DIR}" > "${BACKUP_PARENT}/last-backup"
chmod 600 "${BACKUP_PARENT}/last-backup"

echo
echo "Transmission Modern Themes v2.6 installed successfully."
echo "No Transmission daemon configuration, torrents or download files were changed."
echo "Open your existing Transmission Web UI address (usually http://YOUR-SERVER:9091/transmission/web/?v=26)"
echo "Rollback: sudo bash \"${SOURCE_DIR}/restore.sh\" \"${BACKUP_DIR}\" \"${WEB_ROOT}\""
