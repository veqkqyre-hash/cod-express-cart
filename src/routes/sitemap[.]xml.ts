import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://dreamebeautycosmetics.com";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const paths = [
          "/", "/shop", "/cart", "/checkout", "/contact", "/blog",
          "/faq", "/shipping", "/returns", "/privacy", "/terms", "/wishlist",
        ];
        const urls = paths.map(
          (p) => `  <url><loc>${BASE_URL}${p}</loc><changefreq>weekly</changefreq></url>`
        );

        // Dynamic entries (products, categories, blog posts)
        try {
          const { createClient } = await import("@supabase/supabase-js");
          const sb = createClient(
            process.env["SUPABASE_URL"]!,
            process.env["SUPABASE_PUBLISHABLE_KEY"]!,
            { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
          );
          const [products, categories, posts] = await Promise.all([
            sb.from("products").select("slug,updated_at").eq("active", true).limit(1000),
            sb.from("categories").select("slug").limit(200),
            sb.from("blog_posts").select("slug,updated_at").eq("published", true).limit(500),
          ]);
          for (const p of products.data ?? []) {
            urls.push(`  <url><loc>${BASE_URL}/product/${p.slug}</loc><lastmod>${new Date(p.updated_at as string).toISOString().slice(0, 10)}</lastmod><changefreq>weekly</changefreq></url>`);
          }
          for (const c of categories.data ?? []) {
            urls.push(`  <url><loc>${BASE_URL}/shop?category=${c.slug}</loc><changefreq>weekly</changefreq></url>`);
          }
          for (const b of posts.data ?? []) {
            urls.push(`  <url><loc>${BASE_URL}/blog/${b.slug}</loc><lastmod>${new Date(b.updated_at as string).toISOString().slice(0, 10)}</lastmod><changefreq>monthly</changefreq></url>`);
          }
        } catch {
          // fall back to static paths only
        }
        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");
        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
