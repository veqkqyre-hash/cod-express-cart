import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { SEO_KEY, SEO_PAGES, sitemapXml, type SeoSettings } from "./seo";

export async function getSitemapXml() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const client = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey", key);
      return fetch(input, { ...init, headers });
    } },
  });
  const { data, error } = await client.from("site_settings").select("value").eq("key", SEO_KEY).maybeSingle();
  if (error) throw error;
  const paths = [...SEO_PAGES];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await client.from("products").select("slug").eq("active", true).order("id").range(offset, offset + 499);
    if (error) throw error;
    paths.push(...(data ?? []).map((item) => `/product/${encodeURIComponent(item.slug)}`));
    if ((data?.length ?? 0) < 500) break;
  }
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await client.from("categories").select("slug").order("id").range(offset, offset + 499);
    if (error) throw error;
    paths.push(...(data ?? []).map((item) => `/shop?category=${encodeURIComponent(item.slug)}`));
    if ((data?.length ?? 0) < 500) break;
  }
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await client.from("blog_posts").select("slug").eq("published", true).order("id").range(offset, offset + 499);
    if (error) throw error;
    paths.push(...(data ?? []).map((item) => `/blog/${encodeURIComponent(item.slug)}`));
    if ((data?.length ?? 0) < 500) break;
  }
  // Product updated_at also changes for stock/sales, not necessarily content.
  // Omit lastmod rather than invent a content modification timestamp.
  return sitemapXml(paths, (data?.value ?? {}) as SeoSettings);
}