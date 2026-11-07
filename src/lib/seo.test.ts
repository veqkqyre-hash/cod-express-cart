import { describe, it, expect } from "vitest";
import { canonicalFor, validateSeo, sitemapXml, productGaps, applySeoHead } from "./seo";

describe("SEO production rules", () => {
  it("uses only the requested production domain", () => {
    expect(canonicalFor("/shop")).toBe("https://dreamebeautycosmetics.com/shop");
    expect(() => validateSeo("/shop", { canonical: "https://cod-express-cart.lovable.app/shop" })).toThrow();
  });
  it("canonical points to the page itself", () => {
    expect(() => canonicalFor("/shop", "https://dreamebeautycosmetics.com/")).toThrow();
  });
  it("sitemap excludes deselected pages and never invents lastmod", () => {
    const xml = sitemapXml(["/", "/shop", "/shop"], { "/shop": { sitemap: false } });
    expect(xml).toContain("<loc>https://dreamebeautycosmetics.com/</loc>");
    expect(xml).not.toContain("/shop");
    expect(xml).not.toContain("lastmod");
  });
  it("checks missing images and both descriptions", () => {
    expect(productGaps({ images: ["photo.jpg"], description_sq: " ", description_en: "English" })).toEqual({ image: false, sq: true, en: false });
    expect(productGaps({})).toEqual({ image: true, sq: true, en: true });
  });
  it("replaces canonical instead of duplicating it", () => {
    const head = applySeoHead({ canonical: canonicalFor("/shop") }, { links: [{ rel: "canonical", href: "/" }] });
    expect(head.links).toEqual([{ rel: "canonical", href: "https://dreamebeautycosmetics.com/shop" }]);
  });
});