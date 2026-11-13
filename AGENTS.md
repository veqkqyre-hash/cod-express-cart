<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- SEO overrides live in the dedicated public-readable, admin-writable `site_settings` SEO row; never modify existing business settings or widen role policies for SEO.
- Leaf route SEO loaders use public server reads for SSR and the existing browser Data API on static cPanel navigation, because cPanel does not host TanStack RPC endpoints.
- The cPanel exporter must embed saved SEO in HTML and emit a real static sitemap; preserve the existing 19-route deployment whitelist and PHP/Apache deployment boundary.
- Sitemap collections are paginated with stable IDs and fail closed on read errors; omit lastmod when no authoritative content-only timestamp is available.
- Backup & Restore is admin-only: database+photos snapshots go through admin-checked SECURITY DEFINER functions (create/verify/restore_db_backup) with upsert-only restore and an automatic pre-restore snapshot; website files stay unavailable until a real cPanel connection exists.
- Product options use separate persistent variants, optional product specifications and atomic authenticated database RPCs for edits and checkout, so cPanel needs no Node endpoints; removed variants are deactivated to retain order references.
- Cart identity is product ID plus optional variant ID; order lines retain the chosen label and price, while online stock validation locks parent products before variants to remain compatible with POS inventory.
- Admin Products and Inventory share a paginated product query and a separate admin-only ordering record; save complete ID permutations atomically with stale-list checks, never updating product rows or public/POS ordering.
