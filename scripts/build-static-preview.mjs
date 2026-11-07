/**
 * Turn a TanStack Start / Nitro cloudflare-module build into static HTML.
 * Run via: node --env-file=.env scripts/build-static-preview.mjs
 * This exports HTML/assets only; server functions need PHP replacements.
 */
import { cp, mkdir, writeFile, stat, rm, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const dest = path.resolve("static-preview");
const pub = path.resolve(".output/public");
const entry = path.resolve(".output/server/index.mjs");
const paths = [
  "/", "/shop", "/cart", "/checkout", "/admin", "/contact", "/account", "/auth",
  "/wishlist", "/shipping", "/returns", "/terms", "/privacy", "/faq",
  "/blog", "/pos-display", "/product/sample", "/blog/sample", "/order/sample"
];
const exists = async p => stat(p).then(() => true, () => false);
if (!await exists(entry) || !await exists(pub)) {
  throw Error("Build missing .output/server/index.mjs or .output/public");
}
await rm(dest, { recursive: true, force: true });
await mkdir(dest, { recursive: true });
await cp(pub, dest, { recursive: true });

// Nitro's cloudflare-module entry exports fetch(). It is NOT a Node.js HTTP listener.
// No Node.js process is needed on cPanel; worker runs ONLY in GitHub Actions during export.
const worker = (await import(pathToFileURL(entry).href)).default;
if (!worker || typeof worker.fetch !== "function") {
  throw Error("Nitro export has no fetch(request, env, ctx)");
}
let count = 0;
for (const route of paths) {
  const response = await worker.fetch(
    new Request("https://dreamebeautycosmetics.com" + route),
    { ASSETS: { fetch: async () => new Response("Not Found", { status: 404 }) } },
    { waitUntil: () => {} },
  );
  const html = await response.text();
  if (!response.ok || !/^\s*<!doctype html/i.test(html) ||
      /<h1[^>]*>Something went wrong<\/h1>/i.test(html)) {
    throw Error("Cannot statically render " + route + " (" + response.status + ")");
  }
  const file = route === "/" ? path.join(dest, "index.html") :
    path.join(dest, route.slice(1), "index.html");
  await mkdir(path.dirname(file), { recursive: true });
  // The production hostname must be used in SEO metadata (Lovable retains its preview URL).
  const normalized = html.replaceAll("https://cod-express-cart.lovable.app/", "https://dreamebeautycosmetics.com/");
  await writeFile(file, normalized);
  count++;
}
const homepage = await readFile(path.join(dest, "index.html"), "utf8");
if (/sb_secret_|SUPABASE_SERVICE_ROLE_KEY|-----BEGIN .*PRIVATE KEY-----/.test(homepage)) {
  throw Error("Potential credential leak in homepage");
}
if (!await exists(path.join(dest, "assets"))) throw Error("No compiled JS/CSS assets");
await writeFile(path.join(dest, "BUILD-METADATA.json"), JSON.stringify({
  source_commit: process.env.GITHUB_SHA || "manual",
  pages: count,
  requires_php_backend: true,
  status: "staging-only",
}, null, 2));
console.log("Static preview rendered", count, "routes; PHP/backend integration still required.");
