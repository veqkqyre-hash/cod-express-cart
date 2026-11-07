import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { canonicalFor, SEO_KEY, type SeoEntry, type SeoSettings } from "./seo";

export async function readSeo(client: SupabaseClient<Database>, path: string): Promise<{ seo: SeoEntry }> {
  const { data, error } = await client.from("site_settings").select("value").eq("key", SEO_KEY).maybeSingle();
  if (error) throw error;
  const settings = (data?.value ?? {}) as SeoSettings;
  let defaults: SeoEntry = {};
  if (path.startsWith("/product/")) {
    const { data: product, error } = await client.from("products").select("name_sq,description_sq,image_url,images").eq("slug", decodeURIComponent(path.slice(9))).eq("active", true).maybeSingle();
    if (error) throw error;
    if (product) defaults = { title: `${product.name_sq} — Dreame Beauty Cosmetics`, description: product.description_sq ?? undefined, image: product.images?.[0] || product.image_url || undefined };
  }
  if (path.startsWith("/blog/")) {
    const { data: post, error } = await client.from("blog_posts").select("title_sq,excerpt_sq,cover_image").eq("slug", decodeURIComponent(path.slice(6))).eq("published", true).maybeSingle();
    if (error) throw error;
    if (post) defaults = { title: `${post.title_sq} — Dreame Beauty Cosmetics`, description: post.excerpt_sq ?? undefined, image: post.cover_image ?? undefined };
  }
  const seo = { ...defaults, ...settings[path], canonical: canonicalFor(path, settings[path]?.canonical) };
  // Share only actual absolute public images; no bundled/relative placeholders.
  if (!seo.image?.startsWith("https://")) delete seo.image;
  return { seo };
}