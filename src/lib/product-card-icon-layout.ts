/** Public positions for the actions on every product-card image.
 *  Percentages are the center of each control inside the image. */
export const PRODUCT_CARD_ICON_SETTINGS_KEY = "product-card-icon-layout";
export const PRODUCT_CARD_ICON_QUERY_KEY = ["product-card-icon-layout"] as const;

export type ActionIconName = "wishlist" | "quickView" | "addToCart";
export type IconPoint = { x: number; y: number };
export type ProductCardIconLayout = Record<ActionIconName, IconPoint>;

export const DEFAULT_PRODUCT_CARD_ICON_LAYOUT: ProductCardIconLayout = {
  wishlist: { x: 86, y: 13 },
  quickView: { x: 86, y: 30 },
  addToCart: { x: 50, y: 83 },
};

function limitedNumber(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number.NaN;
  return Number.isFinite(n) ? Math.max(7, Math.min(93, n)) : fallback;
}

export function parseProductCardIconLayout(value: unknown): ProductCardIconLayout {
  const object = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
  const parse = (key: ActionIconName): IconPoint => {
    const input = object[key];
    const point = input && typeof input === "object" && !Array.isArray(input)
      ? input as Record<string, unknown> : {};
    const fallback = DEFAULT_PRODUCT_CARD_ICON_LAYOUT[key];
    return {
      x: limitedNumber(point.x, fallback.x),
      y: limitedNumber(point.y, fallback.y),
    };
  };
  return {
    wishlist: parse("wishlist"),
    quickView: parse("quickView"),
    addToCart: parse("addToCart"),
  };
}

export function actionPointStyle(point: IconPoint): { left: string; top: string } {
  return { left: `${point.x}%`, top: `${point.y}%` };
}
