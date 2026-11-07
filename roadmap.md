# Roadmap — Backup & Restore
- [x] Real database + photos backup (create, server-side checksum verification, download, history with date/size/status).
- [x] Non-destructive admin-only restore with RIKTHE confirmation and automatic pre-restore backup; tested live.
- [x] cPanel PHP bridge for website backups (status, create, list, signed download); tested locally with a mock cPanel.
- [ ] Activate website backups on cPanel: blocked until the PHP file and config with a cPanel API token are installed (cpanel-php/BACKUP-SETUP.md).
