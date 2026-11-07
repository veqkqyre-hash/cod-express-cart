# SEO Manager — Phase 2

## Backup & Restore
- [ ] Add separate admin-only website/database backup section with honest status and no simulated actions.
- [ ] Show history only from verified sources; provide safe database export/restore instructions.
- [ ] Test admin navigation, unavailable action guards and mobile layout without modifying existing workflows.
- [ ] Enable real cPanel backup/download/restore: blocked by missing authenticated cPanel backup connection.
- [ ] Show real Cloud backup inventory in Admin: blocked by unavailable backup inventory API; managed Backups page is the evidence source.

- [x] Add admin-only SEO editing and product completeness checks without changing existing workflows.
- [x] Apply SEO metadata and sitemap using only https://dreamebeautycosmetics.com; save-to-SSR flow and 7 tests pass.
- [x] Add static sitemap export and metadata verification to the existing HTML exporter; leave GitHub wiring and PHP deployment untouched.
- [ ] Verify new release on live cPanel: blocked until GitHub → cPanel publishes the new files; current live sitemap still returns homepage HTML.
- [ ] Verify dynamic product/blog HTML in cPanel: existing publisher permits only 19 fixed routes and dynamic URLs use homepage fallback; requires a separately approved deployment/routing extension, not silently changing the connection.