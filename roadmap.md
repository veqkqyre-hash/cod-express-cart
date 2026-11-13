# SEO Manager — Phase 2

## Shared Admin product ordering
- [x] Add persistent, atomic ordering separate from product data, shared by Products and Inventory.
- [x] Add mouse/touch drag handles; reject filtered/incomplete permutations and stale saves without changing existing search.
- [x] Real mouse/touch moves persisted across refresh and both views (118 rows); 10 unit tests pass. Real incomplete/stale saves rejected, product rows identical around final RPC tests, initial ordering restored. cPanel release not deployed or verified.

## Product variants and specifications
- [x] Complete six color presets and circular public selectors, prevent half-filled specs and saving during variant photo upload; retain existing schema/APIs.
- [x] Real new test-product create/edit/reopen, 4 specifications, 6 variants, photo upload, independent stock/price, cart refresh and Admin/public mobile checks pass; test product hidden, protected fields unchanged. 12 tests pass. No order created this turn; live cPanel remains unverified.
- [x] Add optional specifications and editable variants to Admin products; use a white product list.
- [x] Show selectable variants publicly and keep each selection in cart and orders.
- [x] Validate stock and price atomically at checkout without changing POS or deployment.
- [x] Run real admin create/edit, variant photo upload, product selection, cart refresh and COD order tests; cancel test orders and hide test product. Ten unit tests pass; incorrect prices and combined overselling rejected with rollback.
- [ ] Verify variant purchase on live cPanel: blocked by the live domain's Bot Verification page and unverified deployment of this release. Local mobile variant controls work; existing header overflow is outside this product-only request.

## Backup & Restore
- [x] Show explicit unavailable Create Full Backup and Restore controls; no simulated jobs or backup rows.
- [x] Database+photos backups: create, verify, download and restore (RIKTHE confirm) working in Admin.
- [x] Remove the expanded restore warning/instructions shown in the user's screenshot; retain honest unavailable status and existing safety gates.
- [ ] Complete backup and restore of website, database and storage together: blocked by missing cPanel access and managed Cloud full-export/restore controls unavailable to app code.
- [x] Add separate admin-only website/database backup section with honest status and no simulated actions.
- [x] Show unavailable history honestly; provide managed database export/restore instructions without invented records.
- [x] Test authenticated admin navigation, unavailable action guards (5 passing tests) and mobile layout; no backup or restore executed.
- [ ] Enable real cPanel backup/download/restore: blocked by missing authenticated cPanel backup connection.
- [ ] Show real Cloud backup inventory in Admin: blocked by unavailable backup inventory API; managed Backups page is the evidence source.

## SEO Manager
- [x] Add admin-only SEO editing and product completeness checks without changing existing workflows.
- [x] Apply SEO metadata and sitemap using only https://dreamebeautycosmetics.com; save-to-SSR flow and 7 tests pass.
- [x] Add static sitemap export and metadata verification to the existing HTML exporter; leave GitHub wiring and PHP deployment untouched.
- [ ] Verify new release on live cPanel: blocked until GitHub → cPanel publishes the new files; current live sitemap still returns homepage HTML.
- [ ] Verify dynamic product/blog HTML in cPanel: existing publisher permits only 19 fixed routes and dynamic URLs use homepage fallback; requires a separately approved deployment/routing extension, not silently changing the connection.