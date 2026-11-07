#!/usr/bin/env bash
# cPanel static site deployment for Dreame Beauty Cosmetics.
# Use --check before --apply. Does not change PHP, .htaccess, database or secrets.
set -Eeuo pipefail
umask 027

SRC="/home/swisskle/cpanel-deploy-stage/cpanel-site"
LIVE="/home/swisskle/dreamebeautycosmetics.com"
BACKUP_BASE="/home/swisskle/.dreame-html-backups"
MODE="${1:---check}"
GIT_CMD="/usr/bin/git -C /home/swisskle/cpanel-deploy-stage pull --ff-only origin cpanel-deploy"
SYNC_LOG="/home/swisskle/cpanel-git-sync.log"
DEPLOY_CMD="/bin/bash /home/swisskle/cpanel-deploy-stage/scripts/cpanel-safe-publish.sh --apply"
DEPLOY_LOG="/home/swisskle/cpanel-auto-publish.log"
CRON_SYNC="*/15 * * * * $GIT_CMD >> $SYNC_LOG 2>&1"
CRON_PUBLISH="*/15 * * * * $GIT_CMD >> $SYNC_LOG 2>&1 && $DEPLOY_CMD >> $DEPLOY_LOG 2>&1"

case "$MODE" in --check|--apply|--activate|--rollback) ;; *) echo "Usage: bash $0 --check|--apply|--activate|--rollback"; exit 2;; esac
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

# Reset the publish cron before rollback so it cannot reapply the update.
if [[ "$MODE" == "--rollback" ]] && command -v crontab >/dev/null 2>&1; then
  tmpcron="$(mktemp /home/swisskle/.dreame-cron.XXXXXX)"
  trap 'rm -f "$tmpcron"' EXIT
  crontab -l > "$tmpcron" 2>/dev/null || true
  if grep -Fq 'cpanel-safe-publish.sh --apply' "$tmpcron"; then
    nextcron="$(mktemp /home/swisskle/.dreame-cron-next.XXXXXX)"
    while IFS= read -r line || [[ -n "$line" ]]; do
      if [[ "$line" == *'cpanel-safe-publish.sh --apply'* ]]; then
        printf '%s\n' "$CRON_SYNC"
      else
        printf '%s\n' "$line"
      fi
    done < "$tmpcron" > "$nextcron"
    crontab "$nextcron"
    rm -f "$nextcron"
    echo "Automatic publishing disabled; GitHub staging sync preserved"
  fi
fi

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
# Configuration formats vary by PHP installation. Verify it is loadable
# without assuming where the credentials are nested; do not print its values.
if ! php -r '$c = require $argv[1]; if (!is_array($c)) exit(1);' "$LIVE/api/config.php" >/dev/null 2>&1; then
  echo "STOP: PHP backend config cannot be loaded as an array"; exit 1
fi
# Check the existing live PHP endpoint, rather than guessing config key names.
# A GET should be refused by the authenticated customers API.
if command -v curl >/dev/null 2>&1; then
  code="$(curl --silent --show-error --output /dev/null --max-time 10 --write-out '%{http_code}' "https://dreamebeautycosmetics.com/api/customers.php" || true)"
  case "$code" in
    401|403|405) ;;
    *) echo "STOP: existing PHP customer API did not pass access check (HTTP $code)"; exit 1 ;;
  esac
fi
page_list="$(mktemp /home/swisskle/.dreame-pages.XXXXXX)"
trap 'rm -f "$page_list"' EXIT
find "$SRC" -type f -name index.html -print0 > "$page_list"
mapfile -d '' -t pages < "$page_list"
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
echo "READY: 19 HTML pages, compiled assets, existing PHP backend and loadable configuration present"
if [[ "$MODE" == "--check" ]]; then
  echo "CHECK ONLY: live website not modified"
  exit 0
fi

# Refuse live activation unless the existing Git sync cron is present exactly once.
if [[ "$MODE" == "--activate" ]]; then
  command -v crontab >/dev/null 2>&1 || { echo "STOP: crontab unavailable"; exit 1; }
  cron_before="$(mktemp /home/swisskle/.dreame-cron-before.XXXXXX)"
  crontab -l > "$cron_before" 2>/dev/null || true
  count=0
  while IFS= read -r cron_line || [[ -n "$cron_line" ]]; do
    if [[ "$cron_line" != \#* && "$cron_line" == *"cpanel-deploy-stage pull --ff-only origin cpanel-deploy"* ]]; then
      count=$((count+1))
    fi
  done < "$cron_before"
  if (( count != 1 )); then
    echo "STOP: expected exactly one existing Git sync Cron Job, found $count"
    rm -f "$cron_before"
    exit 1
  fi
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

# Install compiled JS/CSS/fonts/images and other public static files FIRST.
asset_list="$(mktemp /home/swisskle/.dreame-assets.XXXXXX)"
trap 'rm -f "$page_list" "$asset_list"' EXIT
find "$SRC" -type f -print0 > "$asset_list"
# Never overwrite server configuration, PHP, secrets or Apache rules.
while IFS= read -r -d '' file; do
  rel="${file#"$SRC"/}"
  case "$rel" in
    */index.html|index.html|BUILD-METADATA.json|_headers) continue ;;
    *.php|*.env|.htaccess|api/*|.git/*|.*)
      echo "STOP: prohibited generated file $rel"; exit 1 ;;
  esac
  target="$LIVE/$rel"
  mkdir -p "$(dirname "$target")"
  tmp="$target.next-$"
  cp -- "$file" "$tmp"
  chmod 644 "$tmp"
  mv -f -- "$tmp" "$target"
done < "$asset_list"

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

echo "PUBLISHED: 19 HTML routes + public assets; existing PHP, .htaccess, secrets and database untouched."

if [[ "$MODE" == "--activate" ]]; then
  cron_next="$(mktemp /home/swisskle/.dreame-cron-after.XXXXXX)"
  while IFS= read -r cron_line || [[ -n "$cron_line" ]]; do
    if [[ "$cron_line" != \#* && "$cron_line" == *"cpanel-deploy-stage pull --ff-only origin cpanel-deploy"* ]]; then
      printf '%s\n' "$CRON_PUBLISH"
    else
      printf '%s\n' "$cron_line"
    fi
  done < "$cron_before" > "$cron_next"
  if crontab "$cron_next"; then
    echo "AUTO-PUBLISH ENABLED: Lovable -> GitHub Actions -> cpanel-deploy -> cPanel every 15 minutes"
  else
    echo "WARNING: initial HTML published, but could not activate the Cron Job."
  fi
  rm -f "$cron_before" "$cron_next"
fi

echo "To undo HTML changes and disable auto-publishing: bash $0 --rollback"
