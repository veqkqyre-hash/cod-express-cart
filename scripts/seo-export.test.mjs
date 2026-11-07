import { test } from "node:test";
import assert from "node:assert/strict";
import { exportSitemap } from "./seo-export.mjs";

test("static cPanel sitemap must be XML, never homepage fallback", async () => {
  await assert.rejects(() => exportSitemap(async () => new Response("<!doctype html><html>Homepage</html>", { headers: { "content-type": "text/html" } }), async () => {}, "/tmp"));
});
test("static cPanel export writes the sitemap without PHP deployment changes", async () => {
  let output;
  await exportSitemap(async () => new Response('<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://dreamebeautycosmetics.com/</loc></url></urlset>', { headers: { "content-type": "application/xml" } }), async (path, text) => { output = { path, text }; }, "/tmp/seo-test");
  assert.equal(output.path, "/tmp/seo-test/sitemap.xml");
  assert.ok(output.text.includes("https://dreamebeautycosmetics.com/"));
});