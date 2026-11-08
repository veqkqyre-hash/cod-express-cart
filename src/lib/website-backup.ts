import { supabase } from "@/integrations/supabase/client";
import { SEO_DOMAIN } from "@/lib/seo";

/** PHP bridge installed on cPanel (see cpanel-php/BACKUP-SETUP.md). Uses cPanel's own backup system. */
export const WEBSITE_BACKUP_ENDPOINT = `${SEO_DOMAIN}/api/website-backup.php`;

export type WebsiteBackupFile = { name: string; size: number; modified: string };
export type WebsiteStatus = { configured: boolean; cpanel_ok: boolean; backups: WebsiteBackupFile[]; error?: string };

async function call<T>(action: string, extra: Record<string, unknown> = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Duhet të jeni të kyçur.");
  const res = await fetch(WEBSITE_BACKUP_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action, ...extra }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { error?: string }).error || `HTTP ${res.status}`);
  return json as T;
}

export const websiteStatus = () => call<WebsiteStatus>("status");
export const websiteCreate = () => call<{ ok: boolean; message: string }>("create");
export const websiteDownloadLink = (name: string) => call<{ url: string }>("link", { name });
