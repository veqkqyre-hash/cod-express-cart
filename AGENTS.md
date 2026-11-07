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
- Backup & Restore is admin-only. Database+photo snapshots go through SECURITY DEFINER RPCs (create/verify/restore_db_backup) so they work on static cPanel too; restore is non-destructive upsert (never delete/truncate), skips roles/auth/audit, pauses user triggers, and makes a pre-restore snapshot. Website files use cPanel's own backup via cpanel-php/api/website-backup.php with secrets only in a config file outside the web root; controls enable only when the live status check passes.
