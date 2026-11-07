import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { getSitemapXml } = await import("@/lib/seo-sitemap.server");
          return new Response(await getSitemapXml(), {
            headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=300" },
          });
        } catch {
          return new Response("Sitemap unavailable", { status: 503, headers: { "Cache-Control": "no-store" } });
        }
      },
    },
  },
});
