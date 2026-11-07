/** Standalone HTTP export; works against the built worker or a test server. */
export async function exportSitemap(fetchPage, writeFile, dest) {
  const response = await fetchPage("/sitemap.xml");
  const xml = await response.text();
  if (!response.ok || !response.headers.get("content-type")?.includes("xml") || !xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">') || xml.includes("lovable.app") || /<loc>(?!https:\/\/dreamebeautycosmetics\.com(?:\/|<))/.test(xml)) {
    throw Error("SEO sitemap export failed; no partial sitemap will be published");
  }
  await writeFile(`${dest}/sitemap.xml`, xml);
}

export function verifySeoHtml(html, route) {
  // Protected/admin pages and operational screens are not public search landing pages.
  // They may intentionally omit title, description and canonical tags.
  if (route === "/admin" || route === "/pos-display" || route === "/account" ||
      route === "/auth" || route === "/checkout" || route === "/cart" ||
      route.startsWith("/order/") || route === "/blog/sample" ||
      route === "/product/sample") return;
  if (!/<title>[^<]+<\/title>/.test(html) || !/name="description"/.test(html)) throw Error(`SEO missing on ${route}`);
  if (/https:\/\/[^"< ]*lovable\.app/.test(html.match(/<head[\s\S]*?<\/head>/)?.[0] ?? "")) throw Error(`Preview SEO domain on ${route}`);
  if (!route.startsWith("/admin") && !route.startsWith("/order/") && route !== "/pos-display") {
    const links = html.match(/<link\b[^>]*rel="canonical"[^>]*>/g) ?? [];
    if (links.length !== 1 || !links[0].includes("https://dreamebeautycosmetics.com")) throw Error(`Invalid canonical on ${route}`);
  }
}