/** Public product-card display order for one shop category.
 * Saved separately for every category in site_settings, without changing products. */
export const CATEGORY_PRODUCT_ORDER_QUERY_PREFIX = "shop-category-product-order";
const SETTING_PREFIX = "shop-category-product-order:";

export function categoryProductOrderKey(categoryId: string): string {
  return `${SETTING_PREFIX}${categoryId}`;
}

export function categoryProductOrderQueryKey(categoryId: string): readonly [string, string] {
  return [CATEGORY_PRODUCT_ORDER_QUERY_PREFIX, categoryId];
}

export function readCategoryProductOrder(value: unknown): string[] {
  const raw = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>).ids
    : value;
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((id): id is string =>
    typeof id === "string" && id.length > 0 && id.length <= 128
  ))];
}

/** Stable sort: ordered products first, then newly added products in query order. */
export function sortCategoryProducts<T extends { id: string }>(products: T[], ids: string[]): T[] {
  if (ids.length === 0) return products;
  const priority = new Map(ids.map((id, index) => [id, index]));
  return products
    .map((p, i) => ({ p, i }))
    .sort((a, b) =>
      (priority.get(a.p.id) ?? Number.POSITIVE_INFINITY) -
      (priority.get(b.p.id) ?? Number.POSITIVE_INFINITY) ||
      a.i - b.i
    )
    .map(({ p }) => p);
}
