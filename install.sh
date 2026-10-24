#!/usr/bin/env bash
set -Eeuo pipefail

SOURCE_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_PARENT="/var/backups/transmission-modern"

if (( EUID != 0 )); then
  echo "Run as root: sudo bash install.sh [WEB_DIRECTORY]" >&2
  exit 1
fi

ASSETS=(
  index.html css/base.css css/desktop.css css/mobile.css css/theme.css
  css/refinements.css css/progress.css css/wide-progress.css css/presets.css
  css/minimal-fixed.css css/grid-editor.css js/grid-editor.js
  js/theme-picker.js js/rpc.js js/ui.js js/app.js
)
for asset in "${ASSETS[@]}"; do
  if [[ ! -f "$SOURCE_DIR/$asset" ]]; then
    echo "Missing package file: $asset" >&2
    exit 1
  fi
done

# Identify the daemon's actual custom web root, when one was set.
# This is stronger evidence than a directory simply existing on disk.
read_daemon_web_home() {
  local proc comm value
  for proc in /proc/[0-9]*; do
    [[ -r "$proc/comm" && -r "$proc/environ" ]] || continue
    IFS= read -r comm < "$proc/comm" || true
    [[ "$comm" == transmission-d* ]] || continue
    value="$(tr '\0' '\n' < "$proc/environ" | sed -n 's/^TR_WEB_HOME=//p' | head -n 1)"
    if [[ -n "$value" ]]; then
      printf '%s\n' "$value"
      return 0
    fi
  done
  return 1
}

# Only accept directories with index.html; ignore historical backups.
valid_web_root() {
  [[ -d "$1" && -f "$1/index.html" ]]
}

if [[ -n "${1:-}" ]]; then
  WEB_ROOT="$1"
  echo "Using manually supplied web directory: $WEB_ROOT"
else
  declare -a candidates=()
  declare -A seen=()
  add_candidate() {
    local path="$1" normalized
    valid_web_root "$path" || return 0
    normalized="$(realpath -e -- "$path")" || return 0
    [[ -n "${seen[$normalized]:-}" ]] && return 0
    seen["$normalized"]=1
    candidates+=("$normalized")
  }

  daemon_home="$(read_daemon_web_home || true)"
  if [[ -n "$daemon_home" ]]; then
    if ! valid_web_root "$daemon_home"; then
      echo "Transmission has TR_WEB_HOME=$daemon_home but it contains no index.html." >&2
      echo "Aborting rather than patching a different web directory." >&2
      exit 1
    fi
    WEB_ROOT="$(realpath -e -- "$daemon_home")"
    echo "Detected active web directory from daemon TR_WEB_HOME: $WEB_ROOT"
  else
    # Standard Debian/Ubuntu Transmission 4 and older Transmission layouts.
    add_candidate /usr/share/transmission/public_html
    add_candidate /usr/share/transmission/web
    add_candidate /usr/local/share/transmission/public_html
    add_candidate /usr/local/share/transmission/web
    add_candidate /opt/transmission/public_html
    add_candidate /opt/transmission/web

    # Discover non-standard package layouts; restrict to Transmission directories
    # and exclude backups, avoiding accidental writes to unrelated web apps.
    while IFS= read -r -d '' file; do
      case "$file" in
        */backup/*|*/backups/*|*.backup*/*|*/.git/*) continue ;;
      esac
      add_candidate "${file%/index.html}"
    done < <(find /usr/share/transmission /usr/local/share/transmission /opt/transmission \
      -maxdepth 5 -type f -name index.html -print0 2>/dev/null || true)

    if (( ${#candidates[@]} == 0 )); then
      echo "No Transmission Web UI directory found." >&2
      echo "Run: sudo bash install.sh /path/to/active/transmission/web-directory" >&2
      exit 1
    elif (( ${#candidates[@]} > 1 )); then
      echo "Multiple Transmission Web UI directories found; refusing to guess:" >&2
      printf '  %s\n' "${candidates[@]}" >&2
      echo "Specify the active directory: sudo bash install.sh /path/to/web-directory" >&2
      exit 1
    fi
    WEB_ROOT="${candidates[0]}"
    echo "Auto-detected Transmission web directory: $WEB_ROOT"
  fi
fi

if ! valid_web_root "$WEB_ROOT"; then
  echo "Not a valid Transmission Web UI directory: $WEB_ROOT" >&2
  exit 1
fi
WEB_ROOT="$(realpath -e -- "$WEB_ROOT")"

# Never overwrite our own source tree.
if [[ "$WEB_ROOT" == "$SOURCE_DIR" ]]; then
  echo "Refusing to install into the source directory." >&2
  exit 1
fi

mkdir -p -m 700 "$BACKUP_PARENT"
BACKUP_DIR="$(mktemp -d "$BACKUP_PARENT/backup-$(date +%Y%m%d-%H%M%S)-XXXX")"
chmod 700 "$BACKUP_DIR"
cp -a -- "$WEB_ROOT" "$BACKUP_DIR/web"
printf '%s\n' "$WEB_ROOT" > "$BACKUP_DIR/web-root"
chmod 600 "$BACKUP_DIR/web-root"
echo "Backup saved to: $BACKUP_DIR/web"

install -d -m 755 "$WEB_ROOT/css" "$WEB_ROOT/js"
for asset in "${ASSETS[@]}"; do
  install -m 644 "$SOURCE_DIR/$asset" "$WEB_ROOT/$asset"
done

printf '%s\n' "$BACKUP_DIR" > "$BACKUP_PARENT/last-backup"
chmod 600 "$BACKUP_PARENT/last-backup"

echo
echo "Transmission Modern v2.8.4 installed successfully in: $WEB_ROOT"
echo "Torrent data and daemon settings were not changed."
echo "Open your existing Web UI URL and hard-refresh the browser."
echo "Rollback: sudo bash \"$SOURCE_DIR/restore.sh\" \"$BACKUP_DIR\""
