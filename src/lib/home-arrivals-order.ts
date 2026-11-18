/** Admin-controlled display order for the six "Sapo mbërritën" homepage cards.
 * Only presentation order changes; product prices, data and shop listing stay intact. */
export const HOME_ARRIVALS_ORDER_KEY = "home-arrivals-order";
export const HOME_ARRIVALS_ORDER_QUERY_KEY = ["home-arrivals-order"] as const;

export function readHomeArrivalsOrder(value: unknown): string[] {
  const raw = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>).ids
    : value;
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((id): id is string =>
    typeof id === "string" && id.length > 0 && id.length <= 128
  ))].slice(0, 6);
}

/** Stable fallback to the database's created_at-desc order for unspecified IDs. */
export function orderHomeArrivals<T extends { id: string }>(products: T[], ids: string[]): T[] {
  const rank = new Map(ids.map((id, index) => [id, index]));
  return products
    .map((product, index) => ({ product, index }))
    .sort((a, b) =>
      (rank.get(a.product.id) ?? Number.POSITIVE_INFINITY) -
      (rank.get(b.product.id) ?? Number.POSITIVE_INFINITY) ||
      a.index - b.index
    )
    .map(({ product }) => product);
}
