export const SEO_DOMAIN = "https://dreamebeautycosmetics.com";
export const SEO_KEY = "seo";
export type SeoEntry = {
  title?: string; description?: string; canonical?: string;
  ogTitle?: string; ogDescription?: string; image?: string; sitemap?: boolean;
};
export type SeoSettings = Record<string, SeoEntry>;
export const SEO_PAGES = ["/", "/shop", "/contact", "/blog", "/faq", "/shipping", "/returns", "/privacy", "/terms"];

export function canonicalFor(path: string, input?: string) {
  const expected = new URL(path, SEO_DOMAIN);
  if (expected.origin !== SEO_DOMAIN || expected.hash) throw new Error("URL-ja duhet të jetë në domenin e dyqanit.");
  if (input?.trim()) {
    const supplied = new URL(input.trim());
    if (supplied.origin !== SEO_DOMAIN || supplied.pathname.replace(/\/$/, "") !== expected.pathname.replace(/\/$/, "") || supplied.search !== expected.search || supplied.hash) {
      throw new Error("Canonical duhet të tregojë këtë faqe në https://dreamebeautycosmetics.com.");
    }
    return supplied.href;
  }
  return expected.href;
}

export function validateSeo(path: string, entry: SeoEntry): SeoEntry {
  const canonical = canonicalFor(path, entry.canonical);
  if ((entry.title?.length ?? 0) > 120 || (entry.description?.length ?? 0) > 320) throw new Error("Titulli ose përshkrimi është shumë i gjatë.");
  if (entry.image && new URL(entry.image).origin !== SEO_DOMAIN) throw new Error("Fotoja Open Graph duhet të jetë në domenin e dyqanit.");
  return { ...entry, canonical };
}

export function productGaps(product: { image_url?: string | null; images?: string[] | null; description_sq?: string | null; description_en?: string | null }) {
  return {
    image: !product.image_url?.trim() && !product.images?.some((image) => image.trim()),
    sq: !product.description_sq?.trim(),
    en: !product.description_en?.trim(),
  };
}

type Head = { meta?: Array<Record<string, string | undefined>>; links?: Array<Record<string, string>>; scripts?: Array<{ type: string; children: string }> };
export function applySeoHead(seo: SeoEntry | undefined, original: Head): Head {
  if (!seo) return original;
  const meta = [...(original.meta ?? [])];
  const set = (key: "name" | "property" | "title", value: string, content?: string) => {
    const index = meta.findIndex((item) => item[key] === value || (key === "title" && "title" in item));
    const tag: Record<string, string | undefined> = key === "title" ? { title: value } : { [key]: value, content: content ?? "" };
    if (index < 0) meta.push(tag); else meta[index] = tag;
  };
  if (seo.title) set("title", seo.title);
  if (seo.description) set("name", "description", seo.description);
  const title = seo.ogTitle || seo.title;
  const description = seo.ogDescription || seo.description;
  if (title) { set("property", "og:title", title); set("name", "twitter:title", title); }
  if (description) { set("property", "og:description", description); set("name", "twitter:description", description); }
  if (seo.image) { set("property", "og:image", seo.image); set("name", "twitter:image", seo.image); }
  if (seo.canonical) set("property", "og:url", seo.canonical);
  return { ...original, meta, links: seo.canonical ? [...(original.links ?? []).filter((link) => link.rel !== "canonical"), { rel: "canonical", href: seo.canonical }] : original.links };
}

export function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[char] ?? char));
}
export function sitemapXml(paths: string[], settings: SeoSettings) {
  const urls = [...new Set(paths)].filter((path) => settings[path]?.sitemap !== false)
    .map((path) => `<url><loc>${escapeXml(canonicalFor(path, settings[path]?.canonical))}</loc></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
}