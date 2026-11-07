#!/usr/bin/env bash
# cPanel static site deployment for Dreame Beauty Cosmetics.
# Use --check before --apply. Does not change PHP, .htaccess, database or secrets.
set -Eeuo pipefail
umask 027

SRC="/home/swisskle/cpanel-deploy-stage/cpanel-site"
LIVE="/home/swisskle/dreamebeautycosmetics.com"
BACKUP_BASE="/home/swisskle/.dreame-html-backups"
MODE="${1:---check}"

case "$MODE" in --check|--apply|--rollback) ;; *) echo "Usage: bash $0 --check|--apply|--rollback"; exit 2;; esac
if [[ "$(id -un)" != "swisskle" ]]; then
  echo "STOP: run this under the cPanel account swisskle"; exit 1
fi
if [[ ! -d "$LIVE" || ! -f "$LIVE/index.html" ]]; then
  echo "STOP: current live website not found. Nothing changed."; exit 1
fi
if [[ -L "$LIVE" || -L "$SRC" ]]; then
  echo "STOP: symbolic link at site root. Nothing changed."; exit 1
fi
if ! command -v flock >/dev/null 2>&1; then
  echo "STOP: flock utility missing. Nothing changed."; exit 1
fi
exec 9>"/home/swisskle/.dreame-publish.lock"
flock -n 9 || { echo "STOP: another deployment is running"; exit 1; }

if [[ "$MODE" == "--rollback" ]]; then
  last="$(find "$BACKUP_BASE" -mindepth 1 -maxdepth 1 -type d -print 2>/dev/null | sort -r | head -1)"
  [[ -n "$last" && -f "$last/backup.tar" ]] || { echo "No backup to restore"; exit 1; }
  tar -xf "$last/backup.tar" -C "$LIVE"
  echo "RESTORED HTML backup from $last (assets and PHP unchanged)"
  exit 0
fi

if [[ ! -s "$SRC/index.html" || ! -s "$SRC/admin/index.html" ||
      ! -s "$SRC/checkout/index.html" || ! -s "$SRC/pos-display/index.html" ||
      ! -d "$SRC/assets" || ! -s "$SRC/BUILD-METADATA.json" ]]; then
  echo "STOP: generated cPanel release has not arrived or is incomplete."; exit 1
fi
if ! grep -qi '<!doctype html' "$SRC/index.html"; then
  echo "STOP: release homepage is not HTML"; exit 1
fi
if ! grep -qi 'Dreame Beauty' "$SRC/index.html"; then
  echo "STOP: wrong store or incomplete homepage"; exit 1
fi
if [[ -n "$(find "$SRC" -type l -print -quit)" ]]; then
  echo "STOP: release contains symlinks"; exit 1
fi
if [[ ! -f "$LIVE/api/customers.php" || ! -f "$LIVE/api/visits.php" ]]; then
  echo "STOP: existing PHP customer/visitor backend missing"; exit 1
fi
if [[ ! -f "$LIVE/api/config.php" ]]; then
  echo "STOP: existing PHP backend config missing"; exit 1
fi
if ! php -l "$LIVE/api/customers.php" >/dev/null ||
   ! php -l "$LIVE/api/visits.php" >/dev/null; then
  echo "STOP: live PHP backend syntax invalid"; exit 1
fi
# Check secrets without disclosing them in output.
if ! php -r '
  $c = require $argv[1];
  $role = getenv("SUPABASE_SERVICE_ROLE_KEY") ?: (is_array($c) ? ($c["service_role_key"] ?? "") : "");
  $url = getenv("SUPABASE_URL") ?: (is_array($c) ? ($c["supabase_url"] ?? "") : "");
  if (!$role || !$url) exit(1);
' "$LIVE/api/config.php"; then
  echo "STOP: backend secret key is not configured on cPanel"; exit 1
fi
mapfile -d '' pages < <(find "$SRC" -type f -name index.html -print0)
if (( ${#pages[@]} < 19 )); then
  echo "STOP: release has fewer than 19 HTML routes"; exit 1
fi

# Permit only the 19 routes from the known working PHP/static package.
allowed='|index.html|account/index.html|admin/index.html|auth/index.html|blog/index.html|blog/sample/index.html|cart/index.html|checkout/index.html|contact/index.html|faq/index.html|order/sample/index.html|pos-display/index.html|privacy/index.html|product/sample/index.html|returns/index.html|shipping/index.html|shop/index.html|terms/index.html|wishlist/index.html|'
for file in "${pages[@]}"; do
  rel="${file#"$SRC"/}"
  if [[ "$allowed" != *"|$rel|"* ]]; then
    echo "STOP: unexpected HTML route $rel"; exit 1
  fi
done
if [[ "${#pages[@]}" -ne 19 ]]; then
  echo "STOP: expected exactly 19 site routes"; exit 1
fi
echo "READY: 19 HTML pages, compiled assets, existing PHP backend and private configuration present"
if [[ "$MODE" == "--check" ]]; then
  echo "CHECK ONLY: live website not modified"
  exit 0
fi

# Backup HTML only; compiled assets are content-hashed and only new ones are added.
stamp="$(date -u '+%Y%m%dT%H%M%SZ')-$$"
backup="$BACKUP_BASE/$stamp"
mkdir -p "$backup"
old_pages=()
for file in "${pages[@]}"; do
  rel="${file#"$SRC"/}"
  [[ -f "$LIVE/$rel" ]] && old_pages+=("$rel")
done
if (( ${#old_pages[@]} > 0 )); then
  tar -cf "$backup/backup.tar" -C "$LIVE" "${old_pages[@]}"
else
  tar -cf "$backup/backup.tar" -T /dev/null
fi
echo "Backup saved: $backup"

# Install hashed assets FIRST. HTML remains unchanged until assets are ready.
while IFS= read -r -d '' file; do
  rel="${file#"$SRC"/}"
  target="$LIVE/$rel"
  mkdir -p "$(dirname "$target")"
  tmp="$target.next-$$"
  cp -- "$file" "$tmp"
  chmod 644 "$tmp"
  mv -f -- "$tmp" "$target"
done < <(find "$SRC/assets" -type f -print0)

# Install HTML LAST, each file atomically; never change existing PHP or .htaccess.
for file in "${pages[@]}"; do
  rel="${file#"$SRC"/}"
  target="$LIVE/$rel"
  mkdir -p "$(dirname "$target")"
  tmp="$target.next-$$"
  cp -- "$file" "$tmp"
  chmod 644 "$tmp"
  mv -f -- "$tmp" "$target"
done

echo "PUBLISHED: 19 HTML routes + hashed assets; existing PHP, .htaccess, secrets and database untouched."
echo "To undo HTML changes: bash $0 --rollback"
