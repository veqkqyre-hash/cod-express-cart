# Backup i website-it në cPanel — udhëzimi i instalimit

Paneli Admin → Backup & Restore përdor sistemin e vetë cPanel-it (Backup → Full Backup) përmes një skedari PHP.
Ky skedar NUK prek Cron Job-in dhe as lidhjen Lovable → GitHub → cPanel.

## 1. Krijo API Token në cPanel
cPanel → Security → **Manage API Tokens** → Create. Emri: `dreame-backup`. Kopjo token-in (shfaqet vetëm një herë).

## 2. Vendos skedarin e konfigurimit (JASHTË website-it)
File Manager → `/home/swisskle/` → krijo skedarin **`.dreame-backup-config.php`** me përmbajtjen e `backup-config.example.php`, dhe:
- `cpanel_token` → token-i nga hapi 1
- `link_secret` → 64 shenja të rastësishme (p.sh. në cPanel Terminal: `openssl rand -hex 32`)

Pastaj: kliko me të djathtën → Change Permissions → **600**. Mos e vendos kurrë këtë skedar në GitHub ose brenda `dreamebeautycosmetics.com/`.

## 3. Vendos skedarin PHP
Ngarko `cpanel-php/api/website-backup.php` te:
`/home/swisskle/dreamebeautycosmetics.com/api/website-backup.php` (permissions 644).
Kërkohet PHP 8.1+ me cURL.

## 4. Testo
Admin → Backup & Restore → **Kontrollo lidhjen**. Duhet të shfaqet “I lidhur me cPanel”. Pastaj “Krijo backup të website-it”;
pas disa minutash backup-i `backup-…_swisskle.tar.gz` del në tabelën “Website” me datë, madhësi dhe “Shkarko”.

## Siguria
- Vetëm administratori (kontrollohet live në databazë) mund ta përdorë.
- Token-i i cPanel qëndron vetëm në serverin cPanel; shfletuesi nuk e sheh kurrë.
- Linqet e shkarkimit janë të nënshkruara dhe skadojnë pas 10 minutash.

## Rikthimi i website-it
Rikthimi bëhet në cPanel → **Backup** → “Restore a Home Directory Backup” (ngarko skedarin e shkarkuar),
ose me rikthimin e versionit të mëparshëm në GitHub (Cron-i e publikon vetë).
